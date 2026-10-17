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
const money = (n) => '$' + Number(n).toLocaleString('en-US', Number(n) % 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {});
const TIER_CHOICES = ['0–2,499 sq ft', '2,500–3,999 sq ft', '4,000–5,999 sq ft'];
const VARIANT_OPTION = {
  'hdr-photography': '9a111111-1111-4111-8111-111111111111',
  'cinematic-video': '9b222222-2222-4222-8222-222222222222',
  '3d-virtual-tour': '9c333333-3333-4333-8333-333333333333',
};
const ALA_PRIMARY = [['hdr', 'hdr-photography'], ['video', 'cinematic-video'], ['tour3d', '3d-virtual-tour'], ['aerialPhoto', 'aerial-photography']];
const PLACES_KEY = 'AIzaSyAaP8RKFizdXk4HfoGnNJIQlqZ0iNxm9no';

const st = {
  sqft: null, mode: null, packageId: null, items: { package: new Set(), alacarte: new Set() },
  services: {}, slug: null, from: startOfToday(), days: null, date: null, slot: null, loading: false, err: '',
  address: { line: '', city: '', state: '', zip: '' }, busy: false,
  kind: 'listing', content: { planId: 'reel1', drone: false },
  view: 'week', month: null, missed: null, qty: { staging: 3 },
};
const isContent = () => st.kind === 'content';

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function quote() { if (isContent()) return P.quote({ mode: 'content', planId: st.content.planId, drone: st.content.drone }); if (!st.mode) return { ok: false, error: 'Choose a listing package or build your own.' }; return P.quote({ sqft: st.sqft, mode: st.mode, packageId: st.packageId, items: Array.from(st.items[st.mode]), qty: st.qty }); }
function primarySlug() {
  if (isContent()) return P.CONTENT.slug;
  if (!st.mode) return null;
  if (st.mode === 'package') return st.packageId || null;
  const set = st.items.alacarte;
  const hit = ALA_PRIMARY.find(([k]) => set.has(k));
  return hit ? hit[1] : null;
}
const sameDay = () => !isContent() && !!st.mode && st.items[st.mode].has('sameday');
function okSlot(s) {
  if (!sameDay()) return true;
  const t = s.startLocal.slice(11, 16); // HH:MM, Houston time
  return t >= '08:00' && t <= P.SAMEDAY_LATEST;
}
const daySlots = (k) => ((st.days && st.days[k]) || []).filter(okSlot);
function tierIndex() { const t = P.tierFor(st.sqft); return Math.max(0, Math.min(t, 2)); }

/* ---------- services UI ---------- */
function itemPrice(key) {
  const it = P.ITEMS[key], tier = P.tierFor(st.sqft);
  if (it.prices) { if (tier < 0) return 'from ' + money(it.prices[0]); if (tier >= P.TIERS.length) return 'Quoted'; return money(it.prices[tier]); }
  if (it.perPhoto) return money(it.price) + '/photo';
  return (it.from ? 'from ' : '') + (key === 'aerialVideo' ? '+' : '') + money(it.price);
}
function optRow(key, mode, sub) {
  const it = P.ITEMS[key], id = `o_${mode}_${key}`, on = st.items[mode].has(key);
  return `<label class="opt${sub ? ' sub' : ''}" for="${id}"><input type="checkbox" id="${id}" data-k="${key}" data-m="${mode}"${on ? ' checked' : ''}>` +
    `<span class="t">${it.name}${it.note ? `<small>${it.note}</small>` : ''}</span><span class="p">${itemPrice(key)}</span></label>` +
    (it.perPhoto && on ? qtyRow(key) : '');
}
// Photo count for per-photo add-ons (virtual staging), with the recommended room set.
function qtyRow(key) {
  const it = P.ITEMS[key], n = st.qty[key];
  return `<div class="opt sub qty-row"><span class="t">How many photos?<small>We recommend 3: living room, kitchen and primary bedroom. Add the game room for a 4th.</small></span>` +
    `<span class="qty"><button type="button" data-qty="${key}" data-d="-1" aria-label="One fewer photo"${n <= it.qty.min ? ' disabled' : ''}>−</button>` +
    `<span aria-live="polite"><strong>${n}</strong> · ${money(it.price * n)}</span>` +
    `<button type="button" data-qty="${key}" data-d="1" aria-label="One more photo"${n >= it.qty.max ? ' disabled' : ''}>+</button></span></div>`;
}
function planCard(p) {
  const per = p.reels > 1 ? `<span class="per">${money(Math.round(p.price / p.reels))} per reel${p.monthly ? ` · ${P.CONTENT.minMonths}-month minimum` : ''}</span>` : '<span class="per">Up to 1 hour on location</span>';
  return `<button type="button" class="pkg" role="radio" data-plan="${p.id}" aria-checked="${st.content.planId === p.id}">` +
    `<span class="tag">${p.mostBooked ? 'Most popular' : p.monthly ? 'Monthly' : '&nbsp;'}</span><span class="nm"><strong>${p.monthly ? p.reels + ' reels' : p.name}</strong><span class="pr">${money(p.price)}${p.monthly ? '<small style="font-size:14px">/mo</small>' : ''}</span></span>` +
    `<span class="inc"><span>${p.desc}</span></span>${per}</button>`;
}
function renderContent() {
  $('plansOne').innerHTML = P.CONTENT.plans.filter((p) => !p.monthly).map(planCard).join('');
  $('plansMonthly').innerHTML = P.CONTENT.plans.filter((p) => p.monthly).map(planCard).join('');
  const plan = P.CONTENT.plans.find((p) => p.id === st.content.planId);
  const monthly = plan && plan.monthly;
  $('contentExtras').innerHTML = monthly
    ? `<div class="opt" style="cursor:default"><span class="t">${P.CONTENT.drone.name}<small>Included on every reel in your plan</small></span><span class="p">Included</span></div>`
    : `<label class="opt" for="cDrone"><input type="checkbox" id="cDrone"${st.content.drone ? ' checked' : ''}><span class="t">${P.CONTENT.drone.name}<small>${P.CONTENT.drone.note}</small></span><span class="p">+${money(P.CONTENT.drone.price)}</span></label>`;
  $('planNote').textContent = monthly
    ? 'Book your first shoot now. Alex will confirm your plan and schedule the rest of the month with you.'
    : 'Need it every month? A monthly plan lowers the price per reel and includes drone.';
}
const choiceOf = () => (isContent() ? 'content' : st.mode);
const CHOICE_IDS = { package: 'choicePkg', alacarte: 'choiceAla', content: 'choiceReel' };
const NEEDS_TITLE = { package: 'Choose your package', alacarte: 'Pick your services', content: 'Choose your reels' };
function renderKind() {
  const c = isContent(), ch = choiceOf();
  Object.entries(CHOICE_IDS).forEach(([k, id]) => $(id).setAttribute('aria-checked', String(k === ch)));
  $('flow').hidden = !ch;
  $('form').classList.toggle('chosen', !!ch);
  $('h2').textContent = NEEDS_TITLE[ch] || 'What you need';
  $('h1s').textContent = c ? 'The shoot' : 'The property';
  $('addrLabel').innerHTML = c ? 'Shoot location <span class="opt-hint">(optional, if you know it)</span>' : 'Property address';
  $('sqftField').hidden = c; $('purposeField').hidden = !c;
  $('contentNeeds').hidden = !c; $('listNeeds').hidden = c;
  document.querySelectorAll('.lst-only').forEach((el) => { el.hidden = c; });
  $('brkLabel').textContent = c ? 'Business or brokerage' : 'Brokerage';
  $('notes').placeholder = c ? 'Your handle, the vibe you want, reference reels, anything to feature…' : 'Rooms to feature, HOA rules for drones…';
  $('dateGate').textContent = c ? 'Choose a reel option to see open times.' : 'Add the square footage and choose your services to see open times.';
}
function renderServices() {
  renderKind();
  if (isContent()) { renderContent(); $('svcErr').hidden = true; return; }
  $('pkgs').innerHTML = P.PACKAGES.map((p) => {
    const fits = !(st.sqft > 0) || st.sqft <= p.max;
    return `<button type="button" class="pkg" role="radio" data-p="${p.id}" aria-checked="${st.packageId === p.id}"${fits ? '' : ' disabled'}>` +
      `<span class="tag">${p.mostBooked ? 'Most booked' : '&nbsp;'}</span><span class="nm"><strong>${p.name}</strong><span class="pr">${money(p.price)}</span></span>` +
      `<span class="inc">${p.includes.map((i) => `<span>${i}</span>`).join('')}</span>` +
      `<span class="fit">Homes up to ${p.max.toLocaleString('en-US')} sq ft</span></button>`;
  }).join('');
  $('pkgExtras').innerHTML = ['tour3d', 'droneAddon', 'floorplan', 'staging', 'sameday'].map((k) => optRow(k, 'package')).join('');
  const a = st.items.alacarte;
  $('alaServices').innerHTML = optRow('hdr', 'alacarte') + optRow('video', 'alacarte') + optRow('tour3d', 'alacarte') + optRow('aerialPhoto', 'alacarte') + (a.has('aerialPhoto') ? optRow('aerialVideo', 'alacarte', true) : '');
  const ground = ['hdr', 'video', 'tour3d'].some((k) => a.has(k));
  $('alaAddons').innerHTML = (ground && !a.has('aerialPhoto') ? ['droneAddon'] : []).concat(['floorplan', 'twilight', 'staging', 'sameday']).map((k) => optRow(k, 'alacarte')).join('');
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
  if (isContent()) meta.push($('purpose').value);
  if (addr) meta.push(addr); if (!isContent() && st.sqft > 0) meta.push(st.sqft.toLocaleString('en-US') + ' sq ft');
  if (st.slot) meta.push(dayLabel(st.slot.dayKey, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + st.slot.label);
  $('sumMeta').textContent = meta.length ? meta.join(' · ') : (isContent() ? 'Choose your reels' : 'Add the property to begin');
  if (!q.ok) {
    $('sumLines').innerHTML = ''; $('sumEmpty').hidden = false;
    $('sumEmpty').textContent = st.sqft > 0 ? q.error : 'Add the square footage, then choose a package or services.';
    $('sumTotal').textContent = '$0'; $('barTotal').textContent = '$0'; $('barSub').textContent = 'Choose your services';
  } else {
    $('sumEmpty').hidden = true;
    $('sumLines').innerHTML = q.lines.map((l) => `<li><span>${l.name}</span><span>${l.amount == null ? 'Quoted' : (l.from ? 'from ' : '') + money(l.amount)}</span></li>`).join('');
    const t = q.customQuote ? 'Custom quote' : money(q.total) + (q.monthly ? '/mo' : '');
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
    const page = await fetchSlots(svc, rangeOf());
    if (seq !== loadSeq) return;
    const by = {};
    page.slots.filter((s) => s.bookable).forEach((s) => { (by[s.dayKey] = by[s.dayKey] || []).push(s); });
    st.days = by; st.err = '';
    if (st.slot && !(by[st.slot.dayKey] || []).some((s) => s.key === st.slot.key)) st.slot = null;
    st.date = st.date && daySlots(st.date).length ? st.date : null;
  } catch (e) {
    if (seq !== loadSeq) return;
    st.days = {}; st.err = 'We could not load open times. Please call or text 346-533-4026 and we will book you directly.';
    console.error(e);
  }
  st.loading = false; renderDays(); renderSummary();
}
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
// What to load: the 14-day strip, or the whole visible month (from today if it is the current month).
function rangeOf() {
  if (st.view !== 'month') return { from: st.from, days: 14 };
  const m = st.month, today = startOfToday(), start = m < today ? today : m;
  const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
  return { from: start, days: Math.max(1, Math.round((end - start) / 864e5)) };
}
function renderMonth() {
  const m = st.month, y = m.getFullYear(), mo = m.getMonth(), n = new Date(y, mo + 1, 0).getDate(), first = new Date(y, mo, 1).getDay();
  const today = keyOf(startOfToday()), keys = [];
  let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w) => `<span class="dow" aria-hidden="true">${w}</span>`).join('') + '<span></span>'.repeat(first);
  for (let d = 1; d <= n; d++) {
    const k = keyOf(new Date(y, mo, d)), c = st.loading ? 0 : daySlots(k).length; keys.push(k);
    cells += `<button type="button" class="mday${k === today ? ' today' : ''}" data-d="${k}" aria-pressed="${k === st.date}"${c ? '' : ' disabled'} aria-label="${dayLabel(k, { weekday: 'long', month: 'long', day: 'numeric' })}${c ? '' : ', unavailable'}">${d}</button>`;
  }
  $('month').innerHTML = `<div class="mhead"><button type="button" class="wk-btn" data-mnav="-1" aria-label="Previous month"${m <= monthStart(startOfToday()) ? ' disabled' : ''}>‹</button>` +
    `<strong>${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><button type="button" class="wk-btn" data-mnav="1" aria-label="Next month">›</button></div><div class="mgrid">${cells}</div>`;
  return keys;
}
function renderView() {
  const month = st.view === 'month';
  $('viewWeek').setAttribute('aria-pressed', String(!month)); $('viewMonth').setAttribute('aria-pressed', String(month));
  $('wkWrap').hidden = month; $('month').hidden = !month;
}
function renderDays() {
  const box = $('slotBox');
  renderView();
  if (st.loading) { $('days').innerHTML = ''; if (st.view === 'month') renderMonth(); box.innerHTML = '<p class="note"><span class="spin"></span>Checking Alex’s calendar…</p>'; return; }
  const keys = [];
  if (st.view === 'month') keys.push(...renderMonth());
  else for (let i = 0; i < 14; i++) keys.push(keyOf(addDays(st.from, i)));
  $('days').innerHTML = st.view === 'month' ? '' : keys.filter((k) => new Date(k + 'T12:00').getDay() !== 0).map((k) => {
    const n = daySlots(k).length;
    return `<button type="button" class="day" data-d="${k}" aria-pressed="${k === st.date}"${n ? '' : ' disabled'} aria-label="${dayLabel(k, { weekday: 'long', month: 'long', day: 'numeric' })}${n ? '' : ', unavailable'}">` +
      `<span class="w">${dayLabel(k, { weekday: 'short' })}</span><span class="dn">${dayLabel(k, { day: 'numeric' })}</span><span class="m">${dayLabel(k, { month: 'short' })}</span></button>`;
  }).join('');
  $('prevWk').disabled = st.from <= startOfToday();
  if (st.err) { box.innerHTML = `<p class="note err">${st.err}</p>`; return; }
  if (!st.date || !daySlots(st.date).length) st.date = keys.find((k) => daySlots(k).length && (!st.missed || k >= st.missed)) || keys.find((k) => daySlots(k).length) || null;
  document.querySelectorAll('#days .day, #month .mday').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === st.date)));
  const span = st.view === 'month' ? 'this month' : 'these two weeks';
  const missNote = st.missed && !daySlots(st.missed).length ? `<p class="note">No open times on ${dayLabel(st.missed, { weekday: 'long', month: 'long', day: 'numeric' })}.${st.date ? ' Here’s the next available day.' : ''}</p>` : '';
  if (!st.date) { box.innerHTML = missNote + (sameDay() ? `<p class="note">No 8–9 AM openings ${span} for same-day delivery. Use the arrows to look further ahead, or remove same-day delivery to see all times.</p>` : `<p class="note">No openings ${span}. Use the arrows to look further ahead, or call or text 346-533-4026.</p>`); return; }
  const slots = daySlots(st.date);
  const part = (h) => (h < 12 ? 'Morning' : h < 15 ? 'Midday' : 'Afternoon');
  const groups = {};
  slots.forEach((s) => { const g = part(Number(s.startLocal.slice(11, 13))); (groups[g] = groups[g] || []).push(s); });
  box.innerHTML = missNote + (sameDay() ? '<p class="note">Same-day delivery needs an 8–9 AM start, so only those arrival times are shown.</p>' : '') +
    `<p class="hint">${dayLabel(st.date, { weekday: 'long', month: 'long', day: 'numeric' })} · arrival times, Houston time</p>` +
    Object.entries(groups).map(([g, list]) => `<p class="slot-h">${g}</p><div class="slots">${list.map((s) => `<button type="button" class="slot" data-s="${s.key}" aria-pressed="${!!st.slot && st.slot.key === s.key}">${s.label}</button>`).join('')}</div>`).join('');
}

/* ---------- validation + booking ---------- */
function gap() {
  const q = quote();
  if (!choiceOf()) return ['h0s', 'Choose what you’re booking: a listing package, build your own, or social media reels.'];
  if (isContent()) {
    if (!q.ok) return ['h2', q.error];
    if (!st.slot) return ['h3', 'Pick a date and start time.'];
    return contactGap();
  }
  if (!$('address').value.trim()) return ['address', 'Add the property address.'];
  if (!(st.sqft > 0)) return ['sqft', 'Add the square footage.'];
  if (!q.ok) return ['h2', q.error];
  if (!st.slot) return ['h3', 'Pick a date and arrival time.'];
  return contactGap();
}
function contactGap() {
  if (!$('fname').value.trim() || !$('lname').value.trim()) return ['fname', 'Add your first and last name.'];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value.trim())) return ['email', 'Add a valid email for your confirmation.'];
  if (!e164($('phone').value)) return ['phone', 'Add a 10-digit US mobile number in case we need you on shoot day.'];
  return null;
}
const STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' ');
// The address exactly as Wix's booking form requires it: street number + name, city, state, ZIP.
function parsedAddress() {
  const text = $('address').value.trim();
  const a = st.address || {};
  if (a.picked === text && a.number && a.street && a.city && a.state && a.zip) return a;
  const m = text.replace(/,?\s*(USA|United States)\.?$/i, '').match(/^(\d+[A-Za-z]?)\s+([^,]+?)\s*,\s*([^,]+?)\s*,?\s+([A-Za-z]{2})\.?\s*,?\s*(\d{5})(?:-\d{4})?$/);
  if (m && STATES.includes(m[4].toUpperCase())) return tidy({ number: m[1], street: m[2], city: m[3], state: m[4], zip: m[5] });
  // No commas ("14531 julie meadows ln cypress tx 77433"): split street from city at the street-type word.
  const n = text.replace(/,/g, ' ').replace(/\s+(USA|United States)\.?$/i, '').match(/^(\d+[A-Za-z]?)\s+(.+?)\s+([A-Za-z]{2})\.?\s+(\d{5})(?:-\d{4})?$/);
  if (!n || !STATES.includes(n[3].toUpperCase())) return null;
  const words = n[2].split(/\s+/);
  const SUF = /^(ln|lane|dr|drive|st|street|rd|road|ave|avenue|blvd|boulevard|ct|court|cir|circle|way|trl|trail|pl|place|pkwy|parkway|ter|terrace|loop|cv|cove|xing|crossing|hwy|highway|pass|run|path|sq|square|bnd|bend|holw|hollow|vw|view|pt|point|park|row|glen|grv|grove|hl|hill|hts|heights|mdw|mdws|meadow|meadows|spgs|springs|ridge|rdg|walk|vis|vista|crk|creek|est|estates|landing|lndg|oaks?)\.?$/i;
  let cut = -1; for (let i = words.length - 2; i >= 0; i--) if (SUF.test(words[i])) { cut = i; break; }
  if (cut < 0) return null;
  return tidy({ number: n[1], street: words.slice(0, cut + 1).join(' '), city: words.slice(cut + 1).join(' '), state: n[3], zip: n[4] });
}
function tidy(a) {
  const cap = (x) => x.trim().toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
  return { number: a.number.toUpperCase(), street: cap(a.street), city: cap(a.city), state: a.state.toUpperCase(), zip: a.zip };
}
function e164(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d[0] === '1') return '+' + d;
  return null;
}
function goTo(id) { const el = $(id); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el.focus && /INPUT|SELECT/.test(el.tagName)) setTimeout(() => el.focus({ preventScroll: true }), 300); }
function showErr(m) { $('formErr').textContent = m || ''; $('formErr').hidden = !m; }

function orderSummary(q) {
  const notes0 = $('notes').value.trim();
  if (isContent()) {
    const items = q.lines.map((l) => `${l.name} (${money(l.amount)})`).join(' + ');
    const total = q.monthly ? `CUSTOM QUOTE: MONTHLY PLAN ${money(q.total)}/mo incl. tax, ${P.CONTENT.minMonths}-month minimum` : money(q.total);
    return `ORDER: ${items} | Total ${total} | Social content: ${$('purpose').value} | Location: ${$('address').value.trim() || 'TBD'}${notes0 ? ' | Notes: ' + notes0 : ''}`.slice(0, 2000);
  }
  const lines = q.lines.map((l) => `${l.name} (${l.amount == null ? 'quoted' : (l.from ? 'from ' : '') + money(l.amount)})`).join(' + ');
  const total = q.customQuote ? 'CUSTOM QUOTE' : money(q.total);
  const notes = $('notes').value.trim();
  return `ORDER: ${lines} | Total ${total} | ${st.sqft.toLocaleString('en-US')} sq ft | Address: ${$('address').value.trim()}${notes ? ' | Notes: ' + notes : ''}`.slice(0, 2000);
}

async function createBooking() {
  const svc = await service(st.slug), q = quote();
  const req = bookingRequest(svc, st.slot, {});
  const opt = VARIANT_OPTION[st.slug];
  if (opt) { delete req.totalParticipants; req.participantsChoices = { serviceChoices: [{ numberOfParticipants: 1, choices: [{ optionId: opt, custom: TIER_CHOICES[tierIndex()] }] }] }; }
  const form = {
    first_name: $('fname').value.trim(), last_name: $('lname').value.trim(), email: $('email').value.trim(), phone: e164($('phone').value),
    add_your_message: orderSummary(q), brokerage: $('brokerage').value.trim() || 'Not provided', square_footage: String(st.sqft),
    occupancy: $('occupancy').value, access_method: $('access').value, access_notes: $('accessNotes').value.trim(),
  };
  if (isContent()) {
    // Same Wix booking form as listings; fill the listing-only required fields with plain labels.
    Object.assign(form, { square_footage: 'N/A (social content)', occupancy: 'Occupied', access_method: 'Other', access_notes: 'Social content: ' + $('purpose').value });
    form.address = { country: 'US', addressLine: $('address').value.trim() || 'Location TBD' };
    Object.keys(form).forEach((k) => (form[k] === '' || form[k] == null) && delete form[k]);
    return wixRequest('/bookings/v2/bookings', { body: { booking: req, ...bookingOptions(form) } });
  }
  if ($('golive').value) form.listing_go_live_date = $('golive').value;
  // Full parts when we can read them (picked from Google or typed with city/state/ZIP); otherwise just
  // the street line as typed, which Alex's booking form accepts.
  const ad = parsedAddress();
  // Format verified against Alex's live booking form (Oct 11): country + addressLine, city/ZIP when known.
  form.address = ad
    ? { country: 'US', addressLine: `${ad.number} ${ad.street}`, city: ad.city, postalCode: ad.zip }
    : { country: 'US', addressLine: $('address').value.trim() };
  Object.keys(form).forEach((k) => (form[k] === '' || form[k] == null) && delete form[k]);
  return wixRequest('/bookings/v2/bookings', { body: { booking: req, ...bookingOptions(form) } });
}
async function book() {
  const created = await createBooking();
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
    `<p class="lede">${esc(when)}<br>${esc($('address').value.trim() || (isContent() ? 'Location to be confirmed with Alex' : ''))}</p>` +
    `<div class="card"><ul class="lines">${q.lines.map((l) => `<li><span>${l.name}</span><span>${l.amount == null ? 'Quoted' : (l.from ? 'from ' : '') + money(l.amount)}</span></li>`).join('')}</ul>` +
    `<div class="tot"><span>Total</span><strong>${q.customQuote ? 'Custom quote' : money(q.total) + (q.monthly ? '/mo' : '')}</strong></div>` +
    (q.customQuote ? '<p class="fine">Alex will send your custom quote before the shoot.</p>' : q.monthly ? '<p class="fine">Alex will confirm your plan and schedule the rest of your month.</p>' : '') + '</div>' +
    (isContent()
      ? `<p>A confirmation is on its way to <strong>${esc($('email').value.trim())}</strong>. Alex will reach out before the shoot to plan your content. Reels arrive within 3 business days.</p>`
      : `<p>A confirmation is on its way to <strong>${esc($('email').value.trim())}</strong>. Photos arrive the next business day; video within 24–72 hours.</p>` +
        `<p><a class="btn btn-primary" href="prep.html">Prepare the home <span class="arr">→</span></a></p>`);
  $('done').hidden = false; window.scrollTo(0, 0);
}

/* ---------- events ---------- */
function update(forceSlots) { if (st.slot && !okSlot(st.slot)) st.slot = null; renderServices(); renderRuler(); renderSummary(); refreshAvailability(forceSlots); if (st.days) renderDays(); }
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
  old.replaceWith(fresh); fresh.addEventListener('input', onAddressInput); places = null; placesStatus('key rejected (check website list on the key)');
};
// Step 1: package, build your own or reels. Everything after it follows from this choice.
function choose(c) {
  const first = !choiceOf();
  if (choiceOf() !== c) { st.slot = null; st.date = null; }
  if (c === 'content') st.kind = 'content'; else { st.kind = 'listing'; st.mode = c; }
  update();
  if (first) setTimeout(() => { const t = $(c === 'content' ? 'h2' : 'h1s'); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
Object.entries(CHOICE_IDS).forEach(([k, id]) => $(id).addEventListener('click', () => choose(k)));
['plansOne', 'plansMonthly'].forEach((id) => $(id).addEventListener('click', (e) => { const b = e.target.closest('.pkg'); if (!b) return; st.content.planId = b.dataset.plan; update(); }));
$('purpose').addEventListener('change', renderSummary);
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-qty]'); if (!b || b.disabled) return;
  const k = b.dataset.qty, q = P.ITEMS[k].qty;
  st.qty[k] = Math.max(q.min, Math.min(q.max, st.qty[k] + Number(b.dataset.d)));
  renderServices(); renderSummary();
});
$('pkgs').addEventListener('click', (e) => { const b = e.target.closest('.pkg'); if (!b || b.disabled) return; st.packageId = b.dataset.p; update(); });
document.addEventListener('change', (e) => {
  const c = e.target;
  if (c.id === 'cDrone') { st.content.drone = c.checked; update(); return; }
  if (!c.dataset || !c.dataset.k) return;
  const set = st.items[c.dataset.m];
  const k = c.dataset.k, ground = (s) => ['hdr', 'video', 'tour3d'].some((g) => s.has(g));
  if (c.checked) set.add(k); else { set.delete(k); if (k === 'aerialPhoto') set.delete('aerialVideo'); }
  // Drone with a ground shoot is the $35–$50 add-on; the $115 Aerial Photography is for drone-only orders.
  if (c.dataset.m === 'alacarte' && ground(set) && set.has('aerialPhoto') && !set.has('aerialVideo')) { set.delete('aerialPhoto'); set.add('droneAddon'); }
  if (c.dataset.m === 'alacarte' && !ground(set)) set.delete('droneAddon');
  update();
});
$('days').addEventListener('click', (e) => { const b = e.target.closest('.day'); if (!b || b.disabled) return; st.date = b.dataset.d; st.missed = null; renderDays(); });
$('month').addEventListener('click', (e) => {
  const nav = e.target.closest('[data-mnav]');
  if (nav && !nav.disabled) { st.month = new Date(st.month.getFullYear(), st.month.getMonth() + Number(nav.dataset.mnav), 1); st.date = null; st.missed = null; refreshAvailability(true); return; }
  const b = e.target.closest('.mday'); if (!b || b.disabled) return; st.date = b.dataset.d; st.missed = null; renderDays();
});
function setView(v) {
  if (st.view === v) return;
  if (v === 'month') st.month = monthStart(st.date ? new Date(st.date + 'T12:00') : st.from);
  else st.from = st.date && new Date(st.date + 'T12:00') >= startOfToday() ? new Date(st.date + 'T00:00') : st.from;
  st.view = v; refreshAvailability(true);
}
$('viewWeek').addEventListener('click', () => setView('week'));
$('viewMonth').addEventListener('click', () => setView('month'));
$('jumpDate').min = keyOf(startOfToday());
$('jumpDate').addEventListener('change', (e) => {
  const v = e.target.value; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
  const d = new Date(v + 'T00:00'); if (d < startOfToday()) return;
  st.date = v; st.missed = v;
  if (st.view === 'month') st.month = monthStart(d); else st.from = d;
  refreshAvailability(true);
});
$('slotBox').addEventListener('click', (e) => {
  const b = e.target.closest('.slot'); if (!b) return;
  st.slot = (st.days[st.date] || []).find((s) => s.key === b.dataset.s) || null; renderDays(); renderSummary();
});
$('prevWk').addEventListener('click', () => { const p = addDays(st.from, -14); st.from = p < startOfToday() ? startOfToday() : p; st.date = null; st.missed = null; refreshAvailability(true); });
$('nextWk').addEventListener('click', () => { st.from = addDays(st.from, 14); st.date = null; st.missed = null; refreshAvailability(true); });
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

/* ---------- address suggestions (Google Places API (New); plain typing always works) ---------- */
// Our own dropdown under the address field, fed by AutocompleteSuggestion. The field stays a normal
// input, so whatever the client types is always kept even if Google is unavailable.
(function placesStyles() {
  const css = '.addr-wrap{position:relative}.addr-list{position:absolute;left:0;right:0;top:100%;z-index:30;margin:4px 0 0;padding:6px 0;list-style:none;background:#fff;border:1px solid var(--line,#E2E5EA);border-radius:4px;box-shadow:0 18px 40px -20px rgba(14,16,21,.35)}' +
    '.addr-list li{padding:11px 14px;cursor:pointer;font-size:15px;line-height:1.35}.addr-list li small{display:block;color:var(--muted,#5E6573);font-size:13px}.addr-list li[aria-selected=true],.addr-list li:hover{background:var(--paper,#F5F6F8)}' +
    '.addr-list .gl{padding:6px 14px 2px;font-size:11px;color:var(--muted,#5E6573);cursor:default;background:none}';
  const el = document.createElement('style'); el.textContent = css; document.head.appendChild(el);
})();
let places = null, sessionToken = null, sugg = [], active = -1, seqA = 0, tmr = null;
function addrList() {
  let ul = document.getElementById('addrList');
  if (!ul) {
    const input = $('address');
    const wrap = document.createElement('div'); wrap.className = 'addr-wrap';
    input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
    ul = document.createElement('ul'); ul.id = 'addrList'; ul.className = 'addr-list'; ul.setAttribute('role', 'listbox'); ul.hidden = true;
    wrap.appendChild(ul);
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', 'addrList');
  }
  return ul;
}
function closeList() { const ul = document.getElementById('addrList'); if (ul) ul.hidden = true; active = -1; }
function renderList() {
  const ul = addrList();
  if (!sugg.length) { ul.hidden = true; return; }
  ul.innerHTML = sugg.map((x, i) => {
    const p = x.placePrediction, main = p.mainText ? p.mainText.toString() : p.text.toString(), sec = p.secondaryText ? p.secondaryText.toString() : '';
    return `<li role="option" data-i="${i}" aria-selected="${i === active}">${esc(main)}${sec ? `<small>${esc(sec)}</small>` : ''}</li>`;
  }).join('') + '<li class="gl" aria-hidden="true">Suggestions by Google</li>';
  ul.hidden = false;
}
async function pick(i) {
  const x = sugg[i]; if (!x) return;
  const input = $('address');
  input.value = x.placePrediction.text.toString(); closeList();
  st.address = { line: input.value, city: '', state: '', zip: '' }; renderSummary();
  try {
    const place = x.placePrediction.toPlace();
    await place.fetchFields({ fields: ['formattedAddress', 'addressComponents'] });
    const comp = place.addressComponents || [];
    const get = (t, short) => { const c = comp.find((y) => (y.types || []).includes(t)); return c ? (short ? c.shortText : c.longText) : ''; };
    if (place.formattedAddress) input.value = place.formattedAddress.replace(/, USA$/, '');
    st.address = { line: [get('street_number'), get('route')].filter(Boolean).join(' ') || input.value, number: get('street_number'), street: get('route'), city: get('locality') || get('sublocality') || get('postal_town'), state: get('administrative_area_level_1', true), zip: get('postal_code'), picked: input.value };
    renderSummary();
  } catch (_) { /* keep the typed text */ }
  sessionToken = null;
}
async function suggest() {
  const q = $('address').value.trim();
  if (!places || q.length < 3) { sugg = []; closeList(); return; }
  const my = ++seqA;
  try {
    if (!sessionToken) sessionToken = new places.AutocompleteSessionToken();
    const r = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: q, includedRegionCodes: ['us'], sessionToken, locationBias: { center: { lat: 29.76, lng: -95.37 }, radius: 50000 } });
    if (my !== seqA) return;
    sugg = (r.suggestions || []).filter((x) => x.placePrediction).slice(0, 5); active = -1; renderList();
  } catch (e) { sugg = []; closeList(); placesStatus('suggestions failed: ' + (e && e.message)); }
}
function wireAddress(input) {
  input.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(suggest, 180); });
  input.addEventListener('keydown', (e) => {
    const ul = document.getElementById('addrList'); if (!ul || ul.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, sugg.length - 1); renderList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); renderList(); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') closeList();
  });
  input.addEventListener('blur', () => setTimeout(closeList, 150));
}
document.addEventListener('mousedown', (e) => { const li = e.target.closest && e.target.closest('#addrList li[data-i]'); if (li) { e.preventDefault(); pick(Number(li.dataset.i)); } });
$('address').placeholder = 'Street, city, state and ZIP';
addrList(); // build the dropdown wrapper up front, so the field is never moved while focused
wireAddress($('address'));
const DEBUG = new URLSearchParams(location.search).has('debug');
function placesStatus(msg) {
  if (!DEBUG) return;
  let el = document.getElementById('placesStatus');
  if (!el) { el = document.createElement('p'); el.id = 'placesStatus'; el.className = 'hint'; $('address').closest('.field').appendChild(el); }
  el.textContent = 'Google: ' + msg;
}
placesStatus('loading…');
window.__marzPlaces = async function () {
  try { places = await google.maps.importLibrary('places'); placesStatus('ready'); }
  catch (e) { places = null; placesStatus('library failed: ' + (e && e.message)); }
};
(function loadPlaces() {
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${PLACES_KEY}&loading=async&libraries=places&callback=__marzPlaces`;
  s.async = true; s.onerror = () => placesStatus('script blocked from loading'); document.head.appendChild(s);
})();

/* deep links: book.html?package=pro&sqft=3200 */
const qs = new URLSearchParams(location.search);
if (P.PACKAGES.some((p) => p.id === qs.get('package'))) st.packageId = qs.get('package');
if (/^\d+$/.test(qs.get('sqft') || '')) { $('sqft').value = qs.get('sqft'); st.sqft = parseInt(qs.get('sqft'), 10); }
if (qs.get('type') === 'content' || P.CONTENT.plans.some((p) => p.id === qs.get('plan'))) {
  st.kind = 'content';
  if (P.CONTENT.plans.some((p) => p.id === qs.get('plan'))) st.content.planId = qs.get('plan');
}
if (st.packageId) st.mode = 'package';
if (qs.get('service')) { st.mode = 'alacarte'; const k = qs.get('service'); if (P.ITEMS[k]) st.items.alacarte.add(k); }
update();
