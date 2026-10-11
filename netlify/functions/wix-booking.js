// POST /api/wix-booking?key=YOUR_WIX_WEBHOOK_KEY[&action=cancel|reschedule]
// Receives the "Send a webhook" action from a Wix Automation and prepares a Stripe invoice.
// Timing: the invoice is created at booking as a scheduled draft; Stripe emails it at 7:00 AM
// (Houston time) on the shoot day, due by the end of that day. Nothing is charged automatically.
//   action=cancel      (Wix trigger: booking canceled)    deletes the draft, or voids a sent invoice
//   action=reschedule  (Wix trigger: booking rescheduled) moves the send time and due date
//
// Netlify environment variables:
//   STRIPE_SECRET_KEY        your Stripe secret key
//   WIX_WEBHOOK_KEY          any long random string; the same value goes at the end of the webhook URL in Wix
//   INVOICE_SEND_HOUR        optional, hour of the shoot day the invoice is emailed (Houston time), default 7
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

// Orders from the website booking page carry the full order in the booking message:
// "ORDER: Pro Package ($449) + 3D Virtual Tour ($275) | Total $724 | 3,200 sq ft | Address: …"
function orderFromMessage(f) {
  const text = Object.values(f).find((v) => /ORDER:/.test(v) && /\|\s*Total\s/.test(v));
  if (!text) return null;
  const order = text.slice(text.indexOf('ORDER:') + 6);
  const parts = order.split('|').map((x) => x.trim());
  const totalPart = parts.find((x) => /^Total\s/.test(x)) || '';
  if (/CUSTOM QUOTE/i.test(totalPart)) return { customQuote: true };
  const lines = parts[0].split(' + ').map((l) => {
    const m = l.match(/^(.+?)\s*\((?:from\s*)?\$([\d,]+(?:\.\d+)?)\)$/);
    return m ? { name: m[1].trim(), amount: parseFloat(m[2].replace(/,/g, '')) } : null;
  });
  const total = money(totalPart);
  if (!total || lines.some((l) => !l)) return total ? { total, lines: null } : null;
  const sum = lines.reduce((a, l) => a + l.amount, 0);
  return { total, lines: Math.abs(sum - total) < 0.01 ? lines : null, sqft: (parts.find((x) => /sq ft$/.test(x)) || '') };
}

// Fallback when Wix sends no price: fixed package prices from pricing.js.
function priceFromService(name) {
  const n = name.toLowerCase();
  const pkg = PACKAGES.find((p) => n.includes(p.name.toLowerCase()));
  if (pkg) return pkg.price;
  if (n.includes('aerial')) return ITEMS.aerialPhoto.price;
  return null;
}

// Unix seconds for a wall-clock time in Houston (handles daylight saving).
function houstonUnix(y, m, d, h, mi) {
  for (const off of [5, 6]) {
    const t = Date.UTC(y, m - 1, d, h + off, mi);
    const hh = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hourCycle: 'h23' }).format(t);
    if (Number(hh) === h) return Math.floor(t / 1000);
  }
  return Math.floor(Date.UTC(y, m - 1, d, h + 6, mi) / 1000);
}
// When to email the invoice and when it is due, from the shoot start time.
function invoiceTiming(start, now = Date.now()) {
  const t = Date.parse(start);
  const nowS = Math.floor(now / 1000);
  if (!Number.isFinite(t)) return { sendAt: null, dueAt: nowS + 86400 };
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t).split('-').map(Number);
  const sendAt = houstonUnix(y, m, d, parseInt(process.env.INVOICE_SEND_HOUR || '7', 10), 0);
  const dueAt = Math.max(houstonUnix(y, m, d, 23, 59), nowS + 3600);
  return { sendAt: sendAt > nowS + 3600 ? sendAt : null, dueAt }; // null = send now
}
async function findInvoice(stripe, bookingId) {
  const r = await stripe.invoices.search({ query: `metadata['wix_booking_id']:'${bookingId.replace(/'/g, '')}'`, limit: 1 });
  return r.data[0] || null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });
  // URL forms: /api/wix-booking/KEY[/cancel|/reschedule]  or  /api/wix-booking?key=KEY[&action=…]
  const seg = String(event.path || '').split('/').filter(Boolean);
  const at = seg.findIndex((x) => x === 'wix-booking');
  const tail = at >= 0 ? seg.slice(at + 1) : [];
  const key = (event.queryStringParameters || {}).key || tail[0] || '';
  const pathAction = tail[1] || '';
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
  const action = ((event.queryStringParameters || {}).action || pathAction || '').toLowerCase();
  if (action === 'cancel' || action === 'reschedule') {
    try {
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const inv = await findInvoice(stripe, bookingId);
      if (!inv) return json(200, { ok: true, note: 'No invoice for this booking.' });
      if (action === 'cancel') {
        if (inv.status === 'draft') await stripe.invoices.del(inv.id);
        else if (inv.status === 'open') await stripe.invoices.voidInvoice(inv.id);
        return json(200, { ok: true, canceled: inv.id, was: inv.status });
      }
      if (inv.status !== 'draft') return json(200, { ok: true, note: 'Invoice already sent; due date left as is.', invoice: inv.id });
      const { sendAt, dueAt } = invoiceTiming(start);
      if (sendAt) {
        await stripe.invoices.update(inv.id, { automatically_finalizes_at: sendAt, due_date: dueAt });
        return json(200, { ok: true, rescheduled: inv.id, sendAt });
      }
      await stripe.invoices.update(inv.id, { due_date: dueAt });
      const fin = await stripe.invoices.finalizeInvoice(inv.id, { auto_advance: false });
      await stripe.invoices.sendInvoice(fin.id);
      return json(200, { ok: true, sent: fin.id });
    } catch (err) {
      console.error('wix-booking: ' + action + ' failed', err);
      return json(500, { error: action + ' failed.' });
    }
  }

  const order = orderFromMessage(f);
  if (order && order.customQuote) {
    console.log('wix-booking: custom quote, no automatic invoice', bookingId);
    return json(200, { ok: true, skipped: 'custom quote — send this invoice by hand' });
  }
  const amount = (order && order.total) || money(pick(f, 'price', 'customprice', 'total', 'amount')) || priceFromService(service);

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

    const existing = await findInvoice(stripe, bookingId).catch(() => null);
    if (existing) return json(200, { ok: true, duplicate: true, invoice: existing.id });
    const { sendAt, dueAt } = invoiceTiming(start);
    const description = [service, start, location].filter(Boolean).join(' · ').slice(0, 500);
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      due_date: dueAt,
      auto_advance: !!sendAt,
      ...(sendAt ? { automatically_finalizes_at: sendAt } : {}),
      pending_invoice_items_behavior: 'exclude',
      description,
      footer: 'Thank you for choosing Marz Media Photography. Questions: 346-533-4026 · admin@marzmediaphotography.com',
      metadata: { wix_booking_id: bookingId, source: 'wix-bookings' },
    }, { idempotencyKey: `${idem}-inv` });

    if (invoice.status !== 'draft') {
      return json(200, { ok: true, duplicate: true, invoice: invoice.id }); // already sent for this booking
    }

    const items = order && order.lines
      ? order.lines.map((l) => ({ amount: l.amount, description: l.name }))
      : [{ amount, description: addOns ? `${service} (includes: ${addOns})` : service }];
    for (const [i, it] of items.entries()) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round(it.amount * 100),
        currency: 'usd',
        description: it.description.slice(0, 500),
      }, { idempotencyKey: `${idem}-item-${i}` });
    }

    if (sendAt) return json(200, { ok: true, invoice: invoice.id, scheduled: new Date(sendAt * 1000).toISOString() });
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    await stripe.invoices.sendInvoice(finalized.id);
    return json(200, { ok: true, invoice: finalized.id, url: finalized.hosted_invoice_url });
  } catch (err) {
    console.error('wix-booking: Stripe failed', err);
    return json(500, { error: 'Stripe invoice failed.' });
  }
};
