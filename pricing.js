/*
 * Marz Media — single source of truth for prices, shoot lengths and booking hours.
 * The booking page (browser) and the booking functions (server) both load this file,
 * so a price changed here changes everywhere. Prices are whole US dollars.
 */
(function (root) {
  const TIERS = [
    { max: 2499, label: 'Up to 2,499 sq ft' },
    { max: 3999, label: '2,500–3,999 sq ft' },
    { max: 5999, label: '4,000–5,999 sq ft' },
  ]; // 6,000+ sq ft = custom quote

  const PACKAGES = [
    { id: 'essential', name: 'Essential', price: 349, max: 2499,
      includes: ['HDR photography', 'Cinematic video or reel', '1 twilight photo'] },
    { id: 'pro', name: 'Pro', price: 449, max: 3999, mostBooked: true,
      includes: ['HDR photography', 'Cinematic video or reel', '2 twilight photos'] },
    { id: 'signature', name: 'Signature', price: 599, max: 5999,
      includes: ['HDR photography', 'Cinematic video or reel', '2 twilight photos', 'Priority scheduling'] },
  ];

  // Each item: price (flat) or prices (by sq ft tier), shoot minutes (flat or by tier),
  // and where it can be booked: 'alacarte', 'package', or both.
  const ITEMS = {
    hdr:         { name: 'HDR Photography',     prices: [165, 210, 260], minutes: [75, 105, 135, 165], primary: true, modes: ['alacarte'] },
    video:       { name: 'Cinematic Video',     prices: [225, 275, 325], minutes: [60, 75, 90, 105],   primary: true, modes: ['alacarte'] },
    tour3d:      { name: '3D Virtual Tour',     prices: [225, 275, 325], minutes: [45, 60, 75, 90],    primary: true, modes: ['alacarte', 'package'] },
    aerialPhoto: { name: 'Aerial Photography',  price: 115, minutes: 20, primary: true, modes: ['alacarte'], note: 'Drone photos only, no ground photos' },
    aerialVideo: { name: 'Aerial Video',        price: 50,  minutes: 15, requires: 'aerialPhoto', modes: ['alacarte'], note: 'Add-on to aerial photography' },
    droneAddon:  { name: 'Drone Coverage',      prices: [35, 50, 50], minutes: 20, modes: ['package', 'alacarte'], requiresAny: ['hdr', 'video', 'tour3d'], note: 'Aerial photos added to your shoot' },
    floorplan:   { name: 'Floor Plans',         price: 50,  minutes: 15, modes: ['alacarte', 'package'] },
    twilight:    { name: 'Twilight Photography', price: 75, minutes: 0,  modes: ['alacarte'], note: 'Captured at sunset' },
    sameday:     { name: 'Same-Day Delivery',   price: 75,  minutes: 0,  modes: ['alacarte', 'package'], note: 'Requires an 8–9 AM start' },
    staging:     { name: 'Virtual Staging',     price: 15,  minutes: 0,  modes: ['alacarte', 'package'], perPhoto: true, qty: { def: 3, min: 1, max: 25 }, note: 'Priced per photo' },
  };

  // Social media content (no listing, no square footage). Monthly plans include drone on every reel
  // and are confirmed by Alex (no automatic invoice); single and double reels invoice like listings.
  const CONTENT = {
    slug: 'social-media-reel',
    plans: [
      { id: 'reel1', name: 'Single Reel', price: 165, reels: 1, desc: 'One 30–60 second vertical reel' },
      { id: 'reel2', name: 'Double Reel', price: 279, reels: 2, desc: 'Two different reels from one shoot' },
      { id: 'monthly4', name: 'Monthly 4', price: 599, reels: 4, monthly: true, desc: '4 reels a month, drone included' },
      { id: 'monthly6', name: 'Monthly 6', price: 849, reels: 6, monthly: true, mostBooked: true, desc: '6 reels a month, drone included' },
      { id: 'monthly8', name: 'Monthly 8', price: 1049, reels: 8, monthly: true, desc: '8 reels a month, drone included' },
    ],
    drone: { name: 'Drone Footage', price: 35, note: 'One flight covers every reel from the shoot' },
    minMonths: 3,
    purposes: ['Agent or personal brand', 'Business or product', 'Restaurant or venue', 'Event', 'Other'],
  };

  const TAX_RATE = 0.05; // added to every order total
  const SAMEDAY_LATEST = '09:00'; // same-day delivery shoots must start by this time

  const PACKAGE_MINUTES = (tier) => ITEMS.hdr.minutes[tier] + ITEMS.video.minutes[tier];

  const SCHEDULE = {
    timezone: 'America/Chicago',
    openDays: [1, 2, 3, 4, 5, 6],   // 0 = Sunday … 6 = Saturday
    firstStart: '09:00',            // earliest arrival
    lastEnd: '18:00',               // shoot must wrap by
    stepMinutes: 30,                // spacing between offered start times
    bufferMinutes: 30,              // drive time kept clear before and after each shoot
    minNoticeHours: 12,
    daysAhead: 45,
  };

  function tierFor(sqft) {
    const n = Number(sqft);
    if (!Number.isFinite(n) || n <= 0) return -1;
    const i = TIERS.findIndex((t) => n <= t.max);
    return i === -1 ? TIERS.length : i; // TIERS.length = custom quote
  }

  function pick(v, tier) { return Array.isArray(v) ? v[Math.min(tier, v.length - 1)] : v; }

  /**
   * selection = { sqft, mode: 'package'|'alacarte', packageId, items: [keys], qty: { staging: n } }
   * returns { ok, error, lines:[{key,name,amount}], total, customQuote, minutes, includesTwilight }
   */
  function withTax(lines) {
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    if (tax > 0) lines.push({ key: 'tax', name: `Tax (${+(TAX_RATE * 100).toFixed(2)}%)`, amount: tax, from: false });
    return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
  }

  /** selection = { mode: 'content', planId, drone } */
  function quoteContent(selection) {
    const plan = CONTENT.plans.find((p) => p.id === selection.planId);
    if (!plan) return { ok: false, error: 'Choose a reel option.' };
    const lines = [{ key: plan.id, name: plan.monthly ? `${plan.name} Content Plan (${plan.reels} reels/mo, drone included)` : plan.name, amount: plan.price, from: false }];
    const drone = !plan.monthly && !!selection.drone;
    if (drone) lines.push({ key: 'drone', name: CONTENT.drone.name, amount: CONTENT.drone.price, from: false });
    const t = withTax(lines);
    return { ok: true, mode: 'content', plan, drone, monthly: !!plan.monthly, lines, ...t, customQuote: false, minutes: 60, includesTwilight: false };
  }

  function quote(selection) {
    if (selection && selection.mode === 'content') return quoteContent(selection);
    const sqft = Number(selection && selection.sqft);
    const tier = tierFor(sqft);
    if (tier < 0) return { ok: false, error: 'Enter the home’s square footage.' };
    const mode = selection.mode === 'package' ? 'package' : 'alacarte';
    const keys = Array.from(new Set((selection.items || []).filter((k) => ITEMS[k] && ITEMS[k].modes.includes(mode))));
    const custom = tier >= TIERS.length;
    const lines = [];
    let minutes = 0;
    let includesTwilight = false;

    if (mode === 'package') {
      const pkg = PACKAGES.find((p) => p.id === selection.packageId);
      if (!pkg) return { ok: false, error: 'Choose a package.' };
      if (custom) return { ok: false, error: 'Packages cover homes up to 5,999 sq ft. Build your own for a custom quote.' };
      if (sqft > pkg.max) return { ok: false, error: `${pkg.name} covers homes up to ${pkg.max.toLocaleString('en-US')} sq ft.` };
      lines.push({ key: pkg.id, name: `${pkg.name} Package`, amount: pkg.price });
      minutes += PACKAGE_MINUTES(tier);
      includesTwilight = true;
    } else if (!keys.some((k) => ITEMS[k].primary)) {
      return { ok: false, error: 'Pick at least one service.' };
    }

    for (const k of keys) {
      const it = ITEMS[k];
      if (it.requires && !keys.includes(it.requires)) continue;
      // Build-your-own drone add-on rides on a ground shoot; drone-only orders use Aerial Photography.
      if (mode === 'alacarte' && it.requiresAny && (!it.requiresAny.some((r) => keys.includes(r)) || keys.includes('aerialPhoto'))) continue;
      let price = it.prices ? (custom ? null : pick(it.prices, tier)) : it.price;
      let name = it.name;
      if (it.perPhoto) {
        const n = Math.max(it.qty.min, Math.min(it.qty.max, Math.round(Number((selection.qty || {})[k]) || it.qty.def)));
        price = price * n; name = `${it.name} – ${n} photo${n === 1 ? '' : 's'}`;
      }
      lines.push({ key: k, name, amount: price, from: !!it.from });
      minutes += pick(it.minutes, tier);
      if (k === 'twilight') includesTwilight = true;
    }

    minutes = Math.max(60, Math.ceil(minutes / 15) * 15);
    const priced = lines.filter((l) => l.amount !== null);
    const customQuote = custom || priced.length !== lines.length;
    const subtotal = customQuote ? null : priced.reduce((s, l) => s + l.amount, 0);
    const tax = customQuote ? null : Math.round(subtotal * TAX_RATE * 100) / 100;
    if (!customQuote && tax > 0) lines.push({ key: 'tax', name: `Tax (${+(TAX_RATE * 100).toFixed(2)}%)`, amount: tax, from: false });
    const total = customQuote ? null : Math.round((subtotal + tax) * 100) / 100;
    return { ok: true, tier, mode, lines, subtotal, tax, total, customQuote, minutes, includesTwilight };
  }

  const api = { TIERS, PACKAGES, ITEMS, CONTENT, SCHEDULE, TAX_RATE, SAMEDAY_LATEST, tierFor, quote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarzPricing = api;
})(typeof window !== 'undefined' ? window : globalThis);
