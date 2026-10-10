// POST /api/wix-booking?key=YOUR_WIX_WEBHOOK_KEY
// Receives the "Send a webhook" action from a Wix Automation (trigger: a client books a session)
// and emails the client a Stripe invoice. Nothing is charged automatically.
//
// Netlify environment variables:
//   STRIPE_SECRET_KEY        your Stripe secret key
//   WIX_WEBHOOK_KEY          any long random string; the same value goes at the end of the webhook URL in Wix
//   INVOICE_DAYS_UNTIL_DUE   optional, default 7
//
// In the Wix automation's webhook step, include at least: contact email, contact first and
// last name, service name, price, start date, location, and booking ID.

const crypto = require('crypto');
const Stripe = require('stripe');
const { PACKAGES, ITEMS } = require('../../pricing.js');

const json = (code, body) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Flatten whatever shape Wix sends into lowercase keys with no punctuation, e.g. "contact.email" -> "contactemail".
function flatten(obj, prefix = '', out = {}) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix + k, out);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, prefix + i, out));
  } else if (obj != null) {
    out[prefix.toLowerCase().replace(/[^a-z0-9]/g, '')] = String(obj);
  }
  return out;
}

function pick(f, ...needles) {
  for (const n of needles) {
    const hit = Object.keys(f).find((k) => k === n) || Object.keys(f).find((k) => k.endsWith(n));
    if (hit && f[hit].trim()) return f[hit].trim();
  }
  return '';
}

const money = (s) => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Fallback when Wix sends no price: fixed package prices from pricing.js.
function priceFromService(name) {
  const n = name.toLowerCase();
  const pkg = PACKAGES.find((p) => n.includes(p.name.toLowerCase()));
  if (pkg) return pkg.price;
  if (n.includes('aerial')) return ITEMS.aerialPhoto.price;
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });
  const key = (event.queryStringParameters || {}).key || '';
  const expected = process.env.WIX_WEBHOOK_KEY || '';
  if (!expected || key.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected))) {
    return json(401, { error: 'Bad key.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON.' }); }
  const f = flatten(body);

  const email = pick(f, 'contactemail', 'bookingcontactemail', 'email');
  const first = pick(f, 'bookingcontactfirstname', 'contactnamefirst', 'firstname');
  const last = pick(f, 'bookingcontactlastname', 'contactnamelast', 'lastname');
  const phone = pick(f, 'bookingcontactphone', 'phone');
  const service = pick(f, 'servicename', 'servicenamemainlanguage') || 'Real estate media';
  const start = pick(f, 'startdate', 'starttime');
  const location = pick(f, 'location', 'locationmainlanguage', 'address');
  const bookingId = pick(f, 'bookingid', 'orderid', 'id') || crypto.createHash('sha256').update(email + start + service).digest('hex').slice(0, 24);
  const addOns = pick(f, 'addongroups0addongroupdetails', 'addongroupdetails');
  const amount = money(pick(f, 'price', 'customprice', 'total', 'amount')) || priceFromService(service);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('wix-booking: no client email in payload', Object.keys(f));
    return json(400, { error: 'No client email in the webhook. Add the contact email field in the Wix automation.' });
  }
  if (!amount) {
    console.error('wix-booking: no price for', service, Object.keys(f));
    return json(400, { error: `No price for "${service}". Add the price field in the Wix automation.` });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const idem = `wix-${bookingId}`;
    const name = [first, last].filter(Boolean).join(' ') || email;
    const found = await stripe.customers.list({ email, limit: 1 });
    const customer = found.data[0] || await stripe.customers.create({ name, email, phone: phone || undefined }, { idempotencyKey: `${idem}-cust` });

    const description = [service, start, location].filter(Boolean).join(' · ').slice(0, 500);
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: parseInt(process.env.INVOICE_DAYS_UNTIL_DUE || '7', 10),
      auto_advance: false,
      pending_invoice_items_behavior: 'exclude',
      description,
      footer: 'Thank you for choosing Marz Media Photography. Questions: 346-533-4026 · admin@marzmediaphotography.com',
      metadata: { wix_booking_id: bookingId, source: 'wix-bookings' },
    }, { idempotencyKey: `${idem}-inv` });

    if (invoice.status !== 'draft') {
      return json(200, { ok: true, duplicate: true, invoice: invoice.id }); // already sent for this booking
    }

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: addOns ? `${service} (includes: ${addOns})`.slice(0, 500) : service,
    }, { idempotencyKey: `${idem}-item` });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(finalized.id);
    return json(200, { ok: true, invoice: finalized.id, url: finalized.hosted_invoice_url });
  } catch (err) {
    console.error('wix-booking: Stripe failed', err);
    return json(500, { error: 'Stripe invoice failed.' });
  }
};
