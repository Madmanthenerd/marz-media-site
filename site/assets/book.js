// Marz Media booking page. Pricing comes from pricing.js (window.MarzPricing); availability and the
// booking itself go to Alex's Wix Bookings through the visitor client (../js/wix/*), so every booking
// lands in his Wix dashboard, his Google Calendar, and triggers his Wix confirmation emails.
import { fetchSlots } from '../js/wix/booking.js';
import { fetchServiceBySlug } from '../js/wix/services.js';
import { wixRequest } from '../js/wix/client.js';
import {
  bookingRequest, bookingOptions, bookingIdOf, contactOf, bookingCartRequest, cartIdOf, checkoutRequired,
  checkoutRedirectRequest, confirmedResult,
} from '../js/wix/booking-core.js';

const P = window.MarzPricing;
const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Number(n).toLocaleString('en-US');
const TIER_CHOICES = ['0–2,499 sq ft', '2,500–3,999 sq ft', '4,000–5,999 sq ft'];
const VARIANT_OPTION = {
  'hdr-photography': '9a111111-1111-4111-8111-111111111111',
  'cinematic-video': '9b222222-2222-4222-8222-222222222222',
  '3d-virtual-tour': '9c333333-3333-4333-8333-333333333333',
};
const ALA_PRIMARY = [['hdr', 'hdr-photography'], ['video', 'cinematic-video'], ['tour3d', '3d-virtual-tour'], ['aerialPhoto', 'aerial-photography']];
const PLACES_KEY = 'AIzaSyAaP8RKFizdXk4HfoGnNJIQlqZ0iNxm9no';

const st = {
  sqft: null, mode: 'package', packageId: null, items: { package: new Set(), alacarte: new Set() },
  services: {}, slug: null, from: startOfToday(), days: null, date: null, slot: null, loading: false, err: '',
  address: { line: '', city: '', state: '', zip: '' }, busy: false,
};

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function quote() { return P.quote({ sqft: st.sqft, mode: st.mode, packageId: st.packageId, items: Array.from(st.items[st.mode]) }); }
function primarySlug() {
  if (st.mode === 'package') return st.packageId || null;
  const set = st.items.alacarte;
  const hit = ALA_PRIMARY.find(([k]) => set.has(k));
  return hit ? hit[1] : null;
}
function tierIndex() { const t = P.tierFor(st.sqft); return Math.max(0, Math.min(t, 2)); }

/* ---------- services UI ---------- */
function itemPrice(key) {
  const it = P.ITEMS[key], tier = P.tierFor(st.sqft);
  if (it.prices) { if (tier < 0) return 'from ' + money(it.prices[0]); if (tier >= P.TIERS.length) return 'Quoted'; return money(it.prices[tier]); }
  return (it.from ? 'from ' : '') + (key === 'aerialVideo' ? '+' : '') + money(it.price);
}
function optRow(key, mode, sub) {
  const it = P.ITEMS[key], id = `o_${mode}_${key}`, on = st.items[mode].has(key);
  return `<label class="opt${sub ? ' sub' : ''}" for="${id}"><input type="checkbox" id="${id}" data-k="${key}" data-m="${mode}"${on ? ' checked' : ''}>` +
    `<span class="t">${it.name}${it.note ? `<small>${it.note}</small>` : ''}</span><span class="p">${itemPrice(key)}</span></label>`;
}
function renderServices() {
  $('pkgs').innerHTML = P.PACKAGES.map((p) => {
    const fits = !(st.sqft > 0) || st.sqft <= p.max;
    return `<button type="button" class="pkg" role="radio" data-p="${p.id}" aria-checked="${st.packageId === p.id}"${fits ? '' : ' disabled'}>` +
      `<span class="tag">${p.mostBooked ? 'Most booked' : '&nbsp;'}</span><span class="nm"><strong>${p.name}</strong><span class="pr">${money(p.price)}</span></span>` +
      `<span class="inc">${p.includes.map((i) => `<span>${i}</span>`).join('')}</span>` +
      `<span class="fit">Homes up to ${p.max.toLocaleString('en-US')} sq ft</span></button>`;
  }).join('');
  $('pkgExtras').innerHTML = ['tour3d', 'droneAddon', 'floorplan', 'sameday'].map((k) => optRow(k, 'package')).join('');
  const a = st.items.alacarte;
  $('alaServices').innerHTML = optRow('hdr', 'alacarte') + optRow('video', 'alacarte') + optRow('tour3d', 'alacarte') + optRow('aerialPhoto', 'alacarte') + (a.has('aerialPhoto') ? optRow('aerialVideo', 'alacarte', true) : '');
  $('alaAddons').innerHTML = ['floorplan', 'twilight', 'sameday'].map((k) => optRow(k, 'alacarte')).join('');
  $('modePkg').setAttribute('aria-pressed', st.mode === 'package');
  $('modeAla').setAttribute('aria-pressed', st.mode === 'alacarte');
  $('pkgWrap').hidden = st.mode !== 'package';
  $('alaWrap').hidden = st.mode !== 'alacarte';
  const big = P.tierFor(st.sqft) >= P.TIERS.length;
  $('svcErr').hidden = !(st.mode === 'package' && big);
  $('svcErr').textContent = 'Homes over 5,999 sq ft are custom quoted. Choose Build your own and pick what you need.';
}
function renderRuler() {
  const n = st.sqft, tier = P.tierFor(n), pin = $('pin');
  document.querySelectorAll('.band').forEach((b, i) => b.classList.toggle('on', i === tier));
  if (!(n > 0)) { pin.hidden = true; $('tierHint').textContent = "Pricing follows the home's heated square footage, as listed on HAR or MLS."; return; }
  const pos = n <= 2500 ? n / 2500 * 2.5 : n <= 4000 ? 2.5 + (n - 2500) / 1500 * 1.5 : n <= 6000 ? 4 + (n - 4000) / 2000 * 2 : Math.min(7, 6 + (n - 6000) / 2000);
  pin.hidden = false; pin.style.left = `calc(${pos / 7 * 100}% - 1px)`;
  $('tierHint').textContent = tier < P.TIERS.length ? `${P.TIERS[tier].label} pricing applies.` : '6,000+ sq ft: custom quote. You can still reserve the time now.';
}

/* ---------- summary ---------- */
function dayLabel(dayKey, opts) { const [y, m, d] = dayKey.split('-').map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString('en-US', opts); }
function renderSummary() {
  const q = quote(), addr = $('address').value.trim(), meta = [];
  if (addr) meta.push(addr); if (st.sqft > 0) meta.push(st.sqft.toLocaleString('en-US') + ' sq ft');
  if (st.slot) meta.push(dayLabel(st.slot.dayKey, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + st.slot.label);
  $('sumMeta').textContent = meta.length ? meta.join(' · ') : 'Add the property to begin';
  if (!q.ok) {
    $('sumLines').innerHTML = ''; $('sumEmpty').hidden = false;
    $('sumEmpty').textContent = st.sqft > 0 ? q.error : 'Add the square footage, then choose a package or services.';
    $('sumTotal').textContent = '$0'; $('barTotal').textContent = '$0'; $('barSub').textContent = 'Choose your services';
  } else {
    $('sumEmpty').hidden = true;
    $('sumLines').innerHTML = q.lines.map((l) => `<li><span>${l.name}</span><span>${l.amount == null ? 'Quoted' : (l.from ? 'from ' : '') + money(l.amount)}</span></li>`).join('');
    const t = q.customQuote ? 'Custom quote' : money(q.total);
    $('sumTotal').textContent = t; $('barTotal').textContent = t;
    $('barSub').textContent = st.slot ? dayLabel(st.slot.dayKey, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + st.slot.label : 'Next: pick a time';
  }
  $('barBtn').textContent = gap() ? 'Continue' : 'Confirm booking';
}

/* ---------- availability (live from Wix) ---------- */
let loadSeq = 0;
async function service(slug) {
  if (!st.services[slug]) st.services[slug] = await fetchServiceBySlug(slug);
  return st.services[slug];
}
async function refreshAvailability(force) {
  const q = quote(), slug = primarySlug();
  $('twiNote').hidden = !(q.ok && q.includesTwilight);
  if (!q.ok || !slug) { $('dateGate').hidden = false; $('dateBox').hidden = true; return; }
  $('dateGate').hidden = true; $('dateBox').hidden = false;
  if (!force && slug === st.slug && st.days) { renderDays(); return; }
  st.slug = slug; st.days = null; st.loading = true; renderDays();
  const seq = ++loadSeq;
  try {
    const svc = await service(slug);
    if (!svc) throw new Error('This service is not available online right now.');
    const page = await fetchSlots(svc, { from: st.from, days: 14 });
    if (seq !== loadSeq) return;
    const by = {};
    page.slots.filter((s) => s.bookable).forEach((s) => { (by[s.dayKey] = by[s.dayKey] || []).push(s); });
    st.days = by; st.err = '';
    if (st.slot && !(by[st.slot.dayKey] || []).some((s) => s.key === st.slot.key)) st.slot = null;
    if (!st.date || !by[st.date]) st.date = Object.keys(by).sort()[0] || null;
  } catch (e) {
    if (seq !== loadSeq) return;
    st.days = {}; st.err = 'We could not load open times. Please call or text 346-533-4026 and we will book you directly.';
    console.error(e);
  }
  st.loading = false; renderDays(); renderSummary();
}
function renderDays() {
  const box = $('slotBox');
  if (st.loading) { $('days').innerHTML = ''; box.innerHTML = '<p class="note"><span class="spin"></span>Checking Alex’s calendar…</p>'; return; }
  const keys = [];
  for (let i = 0; i < 14; i++) { const d = addDays(st.from, i); keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }
  $('days').innerHTML = keys.filter((k) => new Date(k + 'T12:00').getDay() !== 0).map((k) => {
    const n = (st.days[k] || []).length;
    return `<button type="button" class="day" data-d="${k}" aria-pressed="${k === st.date}"${n ? '' : ' disabled'} aria-label="${dayLabel(k, { weekday: 'long', month: 'long', day: 'numeric' })}${n ? '' : ', unavailable'}">` +
      `<span class="w">${dayLabel(k, { weekday: 'short' })}</span><span class="dn">${dayLabel(k, { day: 'numeric' })}</span><span class="m">${dayLabel(k, { month: 'short' })}</span></button>`;
  }).join('');
  $('prevWk').disabled = st.from <= startOfToday();
  if (st.err) { box.innerHTML = `<p class="note err">${st.err}</p>`; return; }
  if (!st.date) { box.innerHTML = '<p class="note">No openings in these two weeks. Use the arrows to look further ahead, or call or text 346-533-4026.</p>'; return; }
  const slots = st.days[st.date] || [];
  const part = (h) => (h < 12 ? 'Morning' : h < 15 ? 'Midday' : 'Afternoon');
  const groups = {};
  slots.forEach((s) => { const g = part(Number(s.startLocal.slice(11, 13))); (groups[g] = groups[g] || []).push(s); });
  box.innerHTML = `<p class="hint">${dayLabel(st.date, { weekday: 'long', month: 'long', day: 'numeric' })} · arrival times, Houston time</p>` +
    Object.entries(groups).map(([g, list]) => `<p class="slot-h">${g}</p><div class="slots">${list.map((s) => `<button type="button" class="slot" data-s="${s.key}" aria-pressed="${!!st.slot && st.slot.key === s.key}">${s.label}</button>`).join('')}</div>`).join('');
}

/* ---------- validation + booking ---------- */
function gap() {
  const q = quote();
  if (!$('address').value.trim()) return ['address', 'Add the property address.'];
  if (!(st.sqft > 0)) return ['sqft', 'Add the square footage.'];
  if (!q.ok) return ['h2', q.error];
  if (!st.slot) return ['h3', 'Pick a date and arrival time.'];
  if (!$('fname').value.trim() || !$('lname').value.trim()) return ['fname', 'Add your first and last name.'];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value.trim())) return ['email', 'Add a valid email for your confirmation.'];
  if (!$('phone').value.trim()) return ['phone', 'Add a mobile number in case we need you on shoot day.'];
  return null;
}
function goTo(id) { const el = $(id); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el.focus && /INPUT|SELECT/.test(el.tagName)) setTimeout(() => el.focus({ preventScroll: true }), 300); }
function showErr(m) { $('formErr').textContent = m || ''; $('formErr').hidden = !m; }

function orderSummary(q) {
  const lines = q.lines.map((l) => `${l.name} (${l.amount == null ? 'quoted' : (l.from ? 'from ' : '') + money(l.amount)})`).join(' + ');
  const total = q.customQuote ? 'CUSTOM QUOTE' : money(q.total);
  const notes = $('notes').value.trim();
  return `ORDER: ${lines} | Total ${total} | ${st.sqft.toLocaleString('en-US')} sq ft | Address: ${$('address').value.trim()}${notes ? ' | Notes: ' + notes : ''}`.slice(0, 2000);
}

async function createBooking(withAddress) {
  const svc = await service(st.slug), q = quote();
  const req = bookingRequest(svc, st.slot, {});
  const opt = VARIANT_OPTION[st.slug];
  if (opt) { delete req.totalParticipants; req.participantsChoices = { serviceChoices: [{ numberOfParticipants: 1, choices: [{ optionId: opt, custom: TIER_CHOICES[tierIndex()] }] }] }; }
  const form = {
    first_name: $('fname').value.trim(), last_name: $('lname').value.trim(), email: $('email').value.trim(), phone: $('phone').value.trim(),
    add_your_message: orderSummary(q), brokerage: $('brokerage').value.trim(), square_footage: String(st.sqft),
    occupancy: $('occupancy').value, access_method: $('access').value, access_notes: $('accessNotes').value.trim(),
  };
  if ($('golive').value) form.listing_go_live_date = $('golive').value;
  if (withAddress) form.address = { country: 'US', subdivision: st.address.state ? 'US-' + st.address.state : 'US-TX', city: st.address.city || undefined, postalCode: st.address.zip || undefined, addressLine: st.address.line || $('address').value.trim() };
  Object.keys(form).forEach((k) => (form[k] === '' || form[k] == null) && delete form[k]);
  return wixRequest('/bookings/v2/bookings', { body: { booking: req, ...bookingOptions(form) } });
}
async function book() {
  let created;
  try { created = await createBooking(true); } catch (e) {
    if (e && e.status === 400) created = await createBooking(false); else throw e;
  }
  const bookingId = bookingIdOf(created);
  if (!bookingId) throw new Error('That time was just taken. Please pick another.');
  const cart = await wixRequest('/ecom/v2/carts', { body: bookingCartRequest([bookingId], contactOf(created), null) });
  const cartId = cartIdOf(cart);
  if (!cartId) throw new Error('The booking could not be reserved. Please try again.');
  const calc = await wixRequest(`/ecom/v2/carts/${cartId}/calculate`, { body: {} });
  if (checkoutRequired(st.services[st.slug], calc)) {
    const s = await wixRequest('/headless/v1/redirect-session', { body: checkoutRedirectRequest(cartId, location.origin) });
    if (s && s.redirectSession && s.redirectSession.fullUrl) { location.href = s.redirectSession.fullUrl; return { kind: 'redirect' }; }
  }
  const order = await wixRequest(`/ecom/v2/carts/${cartId}/place-order`, { body: {} });
  return confirmedResult(bookingId, order);
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function showDone(q) {
  $('app').hidden = true; $('bar').hidden = true;
  const when = dayLabel(st.slot.dayKey, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + st.slot.label;
  $('done').innerHTML = `<p class="eyebrow">Confirmed</p><h2>You’re booked, ${esc($('fname').value.trim())}.</h2>` +
    `<p class="lede">${esc(when)}<br>${esc($('address').value.trim())}</p>` +
    `<div class="card"><ul class="lines">${q.lines.map((l) => `<li><span>${l.name}</span><span>${l.amount == null ? 'Quoted' : (l.from ? 'from ' : '') + money(l.amount)}</span></li>`).join('')}</ul>` +
    `<div class="tot"><span>Total</span><strong>${q.customQuote ? 'Custom quote' : money(q.total)}</strong></div>` +
    `<p class="fine">${q.customQuote ? 'Alex will send your custom quote and invoice before the shoot.' : 'Your invoice arrives by email. Nothing is charged today.'}</p></div>` +
    `<p>A confirmation is on its way to <strong>${esc($('email').value.trim())}</strong>. Photos arrive the next business day; video within 24–72 hours.</p>` +
    `<p><a class="btn btn-primary" href="prep.html">Prepare the home <span class="arr">→</span></a></p>`;
  $('done').hidden = false; window.scrollTo(0, 0);
}

/* ---------- events ---------- */
function update(forceSlots) { renderServices(); renderRuler(); renderSummary(); refreshAvailability(forceSlots); }
$('sqft').addEventListener('input', (e) => {
  const n = parseInt(e.target.value, 10); st.sqft = n > 0 ? n : null;
  const cur = P.PACKAGES.find((p) => p.id === st.packageId);
  if (st.sqft && (!cur || st.sqft > cur.max)) { const fit = P.PACKAGES.find((p) => st.sqft <= p.max); st.packageId = fit ? fit.id : null; }
  update();
});
function onAddressInput() { st.address = { line: $('address').value.trim(), city: '', state: '', zip: '' }; renderSummary(); }
$('address').addEventListener('input', onAddressInput);
// If Google rejects the key (e.g. this web address is not on the key's allowed list), Google disables the
// field and fills it with warning icons. Swap in a clean field so clients can always type the address.
window.gm_authFailure = function () {
  const old = $('address'); if (!old) return;
  const fresh = document.createElement('input');
  fresh.type = 'text'; fresh.id = 'address'; fresh.autocomplete = 'street-address';
  fresh.placeholder = 'Type the full property address'; fresh.value = (old.value || '').replace(/^Oops.*$/, '');
  old.replaceWith(fresh); fresh.addEventListener('input', onAddressInput);
};
$('modePkg').addEventListener('click', () => { st.mode = 'package'; update(); });
$('modeAla').addEventListener('click', () => { st.mode = 'alacarte'; update(); });
$('pkgs').addEventListener('click', (e) => { const b = e.target.closest('.pkg'); if (!b || b.disabled) return; st.packageId = b.dataset.p; update(); });
document.addEventListener('change', (e) => {
  const c = e.target; if (!c.dataset || !c.dataset.k) return;
  const set = st.items[c.dataset.m];
  if (c.checked) set.add(c.dataset.k); else { set.delete(c.dataset.k); if (c.dataset.k === 'aerialPhoto') set.delete('aerialVideo'); }
  update();
});
$('days').addEventListener('click', (e) => { const b = e.target.closest('.day'); if (!b || b.disabled) return; st.date = b.dataset.d; renderDays(); });
$('slotBox').addEventListener('click', (e) => {
  const b = e.target.closest('.slot'); if (!b) return;
  st.slot = (st.days[st.date] || []).find((s) => s.key === b.dataset.s) || null; renderDays(); renderSummary();
});
$('prevWk').addEventListener('click', () => { const p = addDays(st.from, -14); st.from = p < startOfToday() ? startOfToday() : p; st.date = null; refreshAvailability(true); });
$('nextWk').addEventListener('click', () => { st.from = addDays(st.from, 14); st.date = null; refreshAvailability(true); });
['fname', 'lname', 'email', 'phone'].forEach((id) => $(id).addEventListener('input', renderSummary));
$('barBtn').addEventListener('click', () => { const g = gap(); if (g) { showErr(g[1]); goTo(g[0]); return; } $('form').requestSubmit(); });
$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const g = gap(); if (g) { showErr(g[1]); goTo(g[0]); return; }
  if ($('company').value) return; // bot
  showErr(''); const q = quote();
  const btns = [$('submit'), $('barBtn')]; btns.forEach((b) => { b.disabled = true; b.innerHTML = '<span class="spin"></span>Booking…'; });
  try {
    const r = await book();
    if (r.kind === 'confirmed') showDone(q);
  } catch (err) {
    console.error(err);
    showErr((err && err.message && !/failed \(\d+\)/.test(err.message) ? err.message + ' ' : '') + 'If this keeps happening, call or text 346-533-4026.');
    st.slot = null; refreshAvailability(true);
  } finally { btns.forEach((b) => { b.disabled = false; }); $('submit').textContent = 'Confirm booking'; renderSummary(); }
});

/* ---------- address suggestions (Google Places; plain typing always works) ---------- */
window.__marzPlaces = async function () {
  try {
    const input = $('address');
    const ac = new google.maps.places.Autocomplete(input, { componentRestrictions: { country: 'us' }, fields: ['formatted_address', 'address_components'] });
    ac.addListener('place_changed', () => {
      const p = ac.getPlace(); if (!p || !p.formatted_address) return;
      const get = (t, s) => { const c = (p.address_components || []).find((x) => x.types.includes(t)); return c ? (s ? c.short_name : c.long_name) : ''; };
      input.value = p.formatted_address;
      st.address = { line: [get('street_number'), get('route')].filter(Boolean).join(' ') || p.formatted_address, city: get('locality') || get('sublocality'), state: get('administrative_area_level_1', true), zip: get('postal_code') };
      renderSummary();
    });
  } catch (_) { /* typing still works */ }
};
(function loadPlaces() {
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_KEY}&libraries=places&callback=__marzPlaces`;
  s.async = true; s.onerror = () => {}; document.head.appendChild(s);
})();

/* deep links: book.html?package=pro&sqft=3200 */
const qs = new URLSearchParams(location.search);
if (P.PACKAGES.some((p) => p.id === qs.get('package'))) st.packageId = qs.get('package');
if (/^\d+$/.test(qs.get('sqft') || '')) { $('sqft').value = qs.get('sqft'); st.sqft = parseInt(qs.get('sqft'), 10); }
if (qs.get('service')) { st.mode = 'alacarte'; const k = qs.get('service'); if (P.ITEMS[k]) st.items.alacarte.add(k); }
update();
