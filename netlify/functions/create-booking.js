// POST /.netlify/functions/create-booking
// Body: { propertyAddress, sqft, bookingPath: 'package'|'alacarte', packageId, services: string[],
//          addons: string[], startISO, endISO, clientName, clientEmail, clientPhone, notes }
//
// What this does, in order:
//   1. Computes the price server-side (never trusts a price sent from the browser)
//   2. Creates a hold on your Google Calendar for the requested slot
//   3. Creates a Stripe customer + invoice (sent, not auto-charged) for that price
//   4. Emails the client a confirmation with the invoice link + shoot-prep guide
//   5. Emails you a quick heads-up that a new booking came in
//
// Required Netlify environment variables:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_CALENDAR_ID
//   STRIPE_SECRET_KEY
//   RESEND_API_KEY, FROM_EMAIL (must be a domain/address verified in Resend)
//   NOTIFY_EMAIL   (your inbox — where new-booking alerts go)

const { google } = require('googleapis');
const Stripe = require('stripe');

const TIMEZONE = 'America/Chicago';

// ---- Pricing: mirrors booking.html exactly. Update both files together. ----
const PACKAGES = {
  essential: { max: 2499, price: 349, label: 'Essential Package', desc: 'HDR photos + video or reel + 1 twilight photo' },
  pro:       { max: 3999, price: 449, label: 'Pro Package', desc: 'HDR photos + video or reel + 2 twilight photos' },
  signature: { max: 5999, price: 599, label: 'Signature Package', desc: '+2 twilights + priority scheduling' },
};
const STANDALONE = {
  hdr:    { label: 'HDR Photography', tiers: [{ max: 2499, price: 165 }, { max: 3999, price: 210 }, { max: 5999, price: 260 }] },
  video:  { label: 'Cinematic Video', tiers: [{ max: 2499, price: 225 }, { max: 3999, price: 275 }, { max: 6000, price: 325 }] },
  tour3d: { label: '3D Virtual Tour', tiers: [{ max: 2499, price: 225 }, { max: 3999, price: 275 }, { max: 5999, price: 325 }] },
};
const ADDONS = {
  aerialPhoto: { label: 'Aerial Photography', price: 115 },
  aerialVideo: { label: 'Aerial Video', price: 50 },
  floorplan:   { label: 'Floor Plans', price: 50 },
  twilight:    { label: 'Twilight Photography', price: 75 },
  sameday:     { label: 'Same-Day Delivery', price: 50 },
};

function tierPrice(tiers, sqft) {
  const t = tiers.find((t) => sqft <= t.max);
  return t ? t.price : null;
}

function computePrice({ bookingPath, packageId, services = [], addons = [], sqft }) {
  const lines = [];
  let customQuote = false;

  if (bookingPath === 'package') {
    const pkg = PACKAGES[packageId];
    if (!pkg || sqft > pkg.max) {
      customQuote = true;
    } else {
      lines.push({ label: pkg.label, amount: pkg.price });
    }
  } else {
    for (const key of services) {
      const svc = STANDALONE[key];
      if (!svc) continue;
      const price = tierPrice(svc.tiers, sqft);
      if (price === null) { customQuote = true; continue; }
      lines.push({ label: svc.label, amount: price });
    }
  }

  for (const key of addons) {
    const addon = ADDONS[key];
    if (!addon) continue;
    // Packages already include twilight — never double-charge it if it slips through
    if (bookingPath === 'package' && key === 'twilight') continue;
    lines.push({ label: addon.label, amount: addon.price });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total, customQuote };
}

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const key = rawKey.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${text}`);
  }
}

function prepGuideHTML() {
  return `
    <h3 style="font-family:sans-serif;">Getting your property ready</h3>
    <ul style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#333;">
      <li>Turn on every interior light, including lamps, before we arrive</li>
      <li>Open all blinds and curtains for natural light</li>
      <li>Clear countertops and remove personal photos or clutter</li>
      <li>Make all beds and straighten cushions/throws</li>
      <li>Put away trash cans, pet bowls, and litter boxes</li>
      <li>Move vehicles out of the driveway and off the street in front of the home</li>
      <li>Tuck away toiletries in bathrooms</li>
      <li>Keep pets secured in a separate room, or offsite, during the shoot</li>
      <li>Have the property fully show-ready before our arrival time</li>
      <li>Send over any gate codes or lockbox info ahead of time</li>
    </ul>
  `;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      propertyAddress, sqft, bookingPath, packageId, services = [], addons = [],
      startISO, endISO,
      clientName, clientEmail, clientPhone, notes,
    } = body;

    if (!propertyAddress || !sqft || !startISO || !endISO || !clientName || !clientEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
    }

    const sqftNum = parseInt(sqft, 10);

    // ---- 1. Price, computed server-side ----
    const { lines, total, customQuote } = computePrice({ bookingPath, packageId, services, addons, sqft: sqftNum });
    if (customQuote || lines.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ customQuote: true, message: 'This selection needs a custom quote — we\'ll follow up directly.' }),
      };
    }

    // ---- 2. Calendar hold ----
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const calEvent = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Shoot: ${clientName} — ${propertyAddress}`,
        location: propertyAddress,
        description: `Client: ${clientName}\nEmail: ${clientEmail}\nPhone: ${clientPhone || 'n/a'}\nSize: ${sqftNum} sq ft\nLine items: ${lines.map(l => `${l.label} ($${l.amount})`).join(', ')}\nNotes: ${notes || 'none'}`,
        start: { dateTime: startISO, timeZone: TIMEZONE },
        end: { dateTime: endISO, timeZone: TIMEZONE },
      },
    });

    // ---- 3. Stripe invoice (sent, not auto-charged) ----
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const existing = await stripe.customers.list({ email: clientEmail, limit: 1 });
    const customer = existing.data[0] || await stripe.customers.create({
      name: clientName,
      email: clientEmail,
      phone: clientPhone || undefined,
    });

    for (const line of lines) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: Math.round(line.amount * 100),
        currency: 'usd',
        description: line.label,
      });
    }

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 7,
      auto_advance: true,
      description: `Shoot at ${propertyAddress}`,
    });
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // ---- 4. Client confirmation + prep guide email ----
    const shootDate = new Date(startISO).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE,
    });
    const lineItemsHTML = lines.map(l => `<div>${l.label} — $${l.amount}</div>`).join('');

    await sendEmail({
      to: clientEmail,
      subject: `Shoot confirmed — ${propertyAddress}`,
      html: `
        <div style="font-family:sans-serif;color:#14161A;">
          <h2 style="font-family:serif;">You're booked.</h2>
          <p><strong>${shootDate}</strong><br>${propertyAddress}</p>
          <div style="margin:16px 0;">${lineItemsHTML}</div>
          <p>Total: <strong>$${total}</strong> — <a href="${finalized.hosted_invoice_url}">view and pay your invoice</a> (due within 7 days).</p>
          ${prepGuideHTML()}
          <p style="margin-top:24px;">Questions? Just reply to this email.</p>
        </div>
      `,
    });

    // ---- 5. Internal notification ----
    if (process.env.NOTIFY_EMAIL) {
      await sendEmail({
        to: process.env.NOTIFY_EMAIL,
        subject: `New booking: ${clientName} — ${propertyAddress}`,
        html: `<div style="font-family:sans-serif;">${shootDate}<br>${propertyAddress}<br>${clientName} — ${clientEmail} — ${clientPhone || 'no phone given'}<br><br>${lineItemsHTML}<br>Total: $${total}<br>Notes: ${notes || 'none'}</div>`,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, total, invoiceUrl: finalized.hosted_invoice_url, eventId: calEvent.data.id }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong creating this booking.' }) };
  }
};
