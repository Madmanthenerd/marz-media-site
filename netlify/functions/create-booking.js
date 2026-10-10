// POST /api/create-booking
// Body: { address, sqft, mode: 'package'|'alacarte', packageId, items: [keys], start (ISO),
//         name, email, phone, brokerage, access, notes }
//
// In order:
//   1. Prices the order server-side from pricing.js (never trusts a price from the browser)
//   2. Re-checks the calendar so two clients can't grab the same time
//   3. Puts the shoot on your Google Calendar
//   4. Creates and sends a Stripe invoice (no charge at booking). 6,000+ sq ft = custom quote, no invoice.
//   5. Emails the client a confirmation + prep guide, and emails you the booking
//
// Netlify environment variables:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_CALENDAR_ID
//   STRIPE_SECRET_KEY
//   RESEND_API_KEY, FROM_EMAIL (an address on a domain verified in Resend), NOTIFY_EMAIL (your inbox)
//   INVOICE_DAYS_UNTIL_DUE (optional, default 7)

const crypto = require('crypto');
const Stripe = require('stripe');
const { quote, PACKAGES } = require('../../pricing.js');
const {
  TZ, houstonDateStr, houstonTime, addDays, calendarClient, calendarId, busyBetween, openSlots,
  formatLong, json, esc,
} = require('./lib/shared');

const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) throw new Error('Resend is not configured.');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.FROM_EMAIL, to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

function linesHTML(q) {
  const rows = q.lines.map((l) => `
    <tr><td style="padding:6px 0;color:#14161A;">${esc(l.name)}</td>
    <td style="padding:6px 0;text-align:right;color:#14161A;">${l.amount == null ? 'Quoted' : (l.from ? 'from ' : '') + money(l.amount)}</td></tr>`).join('');
  const total = q.customQuote ? 'Custom quote' : money(q.total);
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
    <tr><td style="padding:10px 0 0;border-top:1px solid #DADDE3;font-weight:700;">Total</td>
    <td style="padding:10px 0 0;border-top:1px solid #DADDE3;text-align:right;font-weight:700;">${total}</td></tr></table>`;
}

const PREP = [
  'Turn on every light, including lamps and under-cabinet lights',
  'Open blinds and curtains',
  'Clear countertops and put away personal photos',
  'Make beds and straighten cushions and throws',
  'Hide trash cans, pet bowls, and litter boxes',
  'Move cars out of the driveway and off the street in front',
  'Put away bathroom toiletries and towels',
  'Keep pets secured or offsite during the shoot',
];

function clientEmailHTML({ b, q, when, invoiceUrl, dueDays }) {
  const pay = q.customQuote
    ? `<p style="margin:0 0 16px;">This home is over 6,000 sq ft, so I'll send your custom quote and invoice personally before the shoot.</p>`
    : invoiceUrl
      ? `<p style="margin:0 0 16px;">Your invoice is on its way from Stripe. You can also <a href="${esc(invoiceUrl)}" style="color:#1F3A6E;font-weight:700;">view and pay it here</a>. Due within ${dueDays} days. Nothing is charged automatically.</p>`
      : `<p style="margin:0 0 16px;">Your invoice will follow by email shortly. Nothing is charged automatically.</p>`;
  return `<div style="background:#F3F4F6;padding:24px 12px;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;">
    <div style="background:#0E1626;color:#ffffff;padding:22px 26px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;">Marz Media Photography</div>
    <div style="padding:26px;color:#14161A;font-size:15px;line-height:1.55;">
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 6px;">You're booked, ${esc(b.name.split(' ')[0])}.</h1>
      <p style="margin:0 0 20px;color:#545B66;">${esc(when)}<br>${esc(b.address)}</p>
      ${linesHTML(q)}
      <div style="height:18px;"></div>
      ${pay}
      ${q.includesTwilight ? '<p style="margin:0 0 16px;">Your order includes twilight photos. I capture those around sunset and will confirm that timing with you.</p>' : ''}
      <p style="margin:0 0 16px;"><strong>Delivery:</strong> photos the next business day, video in 24–72 hours.</p>
      <h2 style="font-family:Georgia,serif;font-weight:400;font-size:19px;margin:24px 0 8px;">Getting the home ready</h2>
      <ul style="margin:0;padding-left:18px;color:#3A404A;font-size:14px;">${PREP.map((p) => `<li style="margin:3px 0;">${p}</li>`).join('')}</ul>
      <p style="margin:24px 0 0;">Need to change something? Reply to this email or call 346-533-4026.</p>
      <p style="margin:6px 0 0;">— Alex Marzette</p>
    </div>
  </div></div>`;
}

function ownerEmailHTML({ b, q, when, invoiceUrl, invoiceError }) {
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#14161A;">
    <h2 style="margin:0 0 8px;">New booking: ${esc(when)}</h2>
    <p style="margin:0 0 12px;"><strong>${esc(b.address)}</strong> · ${Number(b.sqft).toLocaleString('en-US')} sq ft · ${q.minutes} min on site</p>
    <p style="margin:0 0 12px;">${esc(b.name)}${b.brokerage ? ' · ' + esc(b.brokerage) : ''}<br>${esc(b.email)} · ${esc(b.phone || 'no phone')}</p>
    ${linesHTML(q)}
    <p style="margin:14px 0 0;"><strong>Access:</strong> ${esc(b.access || '—')}<br><strong>Notes:</strong> ${esc(b.notes || '—')}</p>
    <p style="margin:14px 0 0;">${q.customQuote ? '⚠️ Custom quote: send the invoice manually.' : invoiceUrl ? `Invoice sent: <a href="${esc(invoiceUrl)}">${esc(invoiceUrl)}</a>` : `⚠️ Stripe invoice failed: ${esc(invoiceError || 'unknown error')}. Send it manually.`}</p>
  </div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }

  // Bots fill the hidden "company" field; pretend success and do nothing.
  if (b.company) return json(200, { success: true });

  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 200);
  const address = String(b.address || '').trim().slice(0, 300);
  if (!name || !address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Name, a valid email, and the property address are required.' });
  }
  const clean = {
    name, email, address,
    sqft: parseInt(b.sqft, 10),
    phone: String(b.phone || '').slice(0, 40),
    brokerage: String(b.brokerage || '').slice(0, 120),
    access: String(b.access || '').slice(0, 500),
    notes: String(b.notes || '').slice(0, 1500),
  };

  // 1. Price
  const q = quote({ sqft: clean.sqft, mode: b.mode, packageId: b.packageId, items: b.items });
  if (!q.ok) return json(400, { error: q.error });

  // 2. Re-check the time is still open
  const start = new Date(b.start);
  if (isNaN(start)) return json(400, { error: 'Pick a date and time.' });
  const day = houstonDateStr(start);
  const end = new Date(start.getTime() + q.minutes * 60000);
  let calendar;
  try {
    calendar = calendarClient(true);
    const busy = await busyBetween(calendar, houstonTime(day, '00:00'), houstonTime(addDays(day, 1), '00:00'));
    const stillOpen = openSlots(day, q.minutes, busy).some((s) => s.start === start.toISOString());
    if (!stillOpen) return json(409, { error: 'That time was just taken or is no longer available. Please pick another.' });
  } catch (err) {
    console.error('Availability re-check failed', err);
    return json(500, { error: 'Could not reach the calendar. Please try again or call 346-533-4026.' });
  }

  const when = formatLong(start);
  const pkgName = q.mode === 'package' ? (PACKAGES.find((p) => p.id === b.packageId) || {}).name : null;
  const itemsText = q.lines.map((l) => `${l.name}: ${l.amount == null ? 'quoted' : (l.from ? 'from ' : '') + money(l.amount)}`).join('\n');

  // 3. Calendar
  let eventId = null;
  try {
    const ev = await calendar.events.insert({
      calendarId: calendarId(),
      requestBody: {
        summary: `📸 ${pkgName ? pkgName + ' · ' : ''}${clean.address.split(',')[0]} · ${clean.name}`,
        location: clean.address,
        description: [
          `Client: ${clean.name}${clean.brokerage ? ' (' + clean.brokerage + ')' : ''}`,
          `Email: ${clean.email}`,
          `Phone: ${clean.phone || 'n/a'}`,
          `Size: ${clean.sqft.toLocaleString('en-US')} sq ft`,
          '',
          itemsText,
          `Total: ${q.customQuote ? 'CUSTOM QUOTE' : money(q.total)}`,
          q.includesTwilight ? 'Includes twilight: schedule sunset return.' : '',
          '',
          `Access: ${clean.access || '—'}`,
          `Notes: ${clean.notes || '—'}`,
          '',
          'Booked online at book.marzmediaphotography.com',
        ].join('\n'),
        start: { dateTime: start.toISOString(), timeZone: TZ },
        end: { dateTime: end.toISOString(), timeZone: TZ },
        extendedProperties: { private: { source: 'marz-booking' } },
      },
    });
    eventId = ev.data.id;
  } catch (err) {
    console.error('Calendar insert failed', err);
    return json(500, { error: 'Could not save the booking to the calendar. Please try again or call 346-533-4026.' });
  }

  // 4. Stripe invoice
  let invoiceUrl = null;
  let invoiceError = null;
  const dueDays = parseInt(process.env.INVOICE_DAYS_UNTIL_DUE || '7', 10);
  if (!q.customQuote) {
    try {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const key = crypto.createHash('sha256').update(`${clean.email}|${start.toISOString()}|${clean.address}`).digest('hex').slice(0, 40);
      const found = await stripe.customers.list({ email: clean.email, limit: 1 });
      const customer = found.data[0] || await stripe.customers.create(
        { name: clean.name, email: clean.email, phone: clean.phone || undefined, metadata: { brokerage: clean.brokerage } },
        { idempotencyKey: `cust-${key}` },
      );
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: dueDays,
        auto_advance: false,
        pending_invoice_items_behavior: 'exclude',
        description: `${when} · ${clean.address}`,
        metadata: { calendar_event: eventId, sqft: String(clean.sqft) },
      }, { idempotencyKey: `inv-${key}` });
      for (const [i, l] of q.lines.entries()) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          amount: Math.round(l.amount * 100),
          currency: 'usd',
          description: l.name,
        }, { idempotencyKey: `item-${key}-${i}` });
      }
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.sendInvoice(finalized.id);
      invoiceUrl = finalized.hosted_invoice_url;
    } catch (err) {
      console.error('Stripe failed', err);
      invoiceError = err.message;
    }
  }

  // 5. Emails (a failed email never cancels a booking)
  const owner = process.env.NOTIFY_EMAIL;
  const results = await Promise.allSettled([
    sendEmail({
      to: clean.email,
      subject: `You're booked: ${when}`,
      html: clientEmailHTML({ b: clean, q, when, invoiceUrl, dueDays }),
      replyTo: owner,
    }),
    owner ? sendEmail({
      to: owner,
      subject: `New booking · ${clean.address.split(',')[0]} · ${when}`,
      html: ownerEmailHTML({ b: clean, q, when, invoiceUrl, invoiceError }),
      replyTo: clean.email,
    }) : Promise.resolve(),
  ]);
  results.forEach((r) => r.status === 'rejected' && console.error('Email failed', r.reason));

  return json(200, {
    success: true, when, total: q.total, customQuote: q.customQuote,
    invoiceUrl, invoiceSent: !!invoiceUrl, eventId,
  });
};
