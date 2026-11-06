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
    { max: 7999, label: '6,000–7,999 sq ft' },
    { max: 9999, label: '8,000–9,999 sq ft' },
  ]; // 10,000+ sq ft = custom quote

  // Standard packages add extras from STD_EXTRAS. Estate packages (luxury: true) already include
  // drone and floor plans, so they offer fewer extras, and book a longer Wix service (minutes).
  const STD_EXTRAS = ['tour3d', 'droneAddon', 'floorplan', 'staging', 'sameday'];
  const PACKAGES = [
    { id: 'essential', name: 'Essential', price: 349, min: 0, max: 2499, size: 'Homes up to 2,499 sq ft', extras: STD_EXTRAS,
      includes: ['HDR photography', 'Cinematic video or reel', '1 twilight photo'] },
    { id: 'pro', name: 'Pro', price: 449, min: 0, max: 3999, size: '2,500–3,999 sq ft', mostBooked: true, extras: STD_EXTRAS,
      includes: ['HDR photography', 'Cinematic video or reel', '2 twilight photos'] },
    { id: 'signature', name: 'Signature', price: 599, min: 0, max: 5999, size: '4,000–5,999 sq ft', extras: STD_EXTRAS,
      includes: ['HDR photography', 'Cinematic video or reel', '2 twilight photos', 'Priority scheduling'] },
    { id: 'estate', name: 'Estate', price: 899, min: 6000, max: 7999, size: '6,000–7,999 sq ft', luxury: true, minutes: 180, reels: 1, extras: ['tour3d', 'staging'],
      includes: ['HDR photography with detail shots', 'Cinematic video and a vertical reel', 'Drone photos and aerial video', '4 twilight photos', 'Floor plan', 'Priority scheduling'] },
    { id: 'grand-estate', name: 'Grand Estate', price: 1149, min: 8000, max: 9999, size: '8,000–9,999 sq ft', luxury: true, minutes: 240, reels: 2, extras: ['tour3d', 'staging'],
      includes: ['HDR photography with detail shots', 'Cinematic video and 2 vertical reels', 'Drone photos and aerial video', '6 twilight photos', 'Floor plans for every level', 'Priority scheduling'] },
  ];
  const PACKAGE_MAX = Math.max(...PACKAGES.map((p) => p.max));
  // Smallest package that covers the home. Any larger package can also be booked (an upgrade).
  const packageFor = (sqft) => PACKAGES.find((p) => sqft <= p.max) || null;

  // Each item: price (flat) or prices (by sq ft tier), shoot minutes (flat or by tier),
  // and where it can be booked: 'alacarte', 'package', or both.
  const ITEMS = {
    hdr:         { name: 'HDR Photography',     prices: [165, 210, 260, 325, 395], minutes: [75, 105, 135, 165, 195], primary: true, modes: ['alacarte'] },
    video:       { name: 'Cinematic Video',     prices: [225, 275, 325, 375, 425], minutes: [60, 75, 90, 105, 120],  primary: true, modes: ['alacarte'] },
    tour3d:      { name: '3D Virtual Tour',     prices: [225, 275, 325, 375, 425], minutes: [45, 60, 75, 90, 105],    primary: true, modes: ['alacarte', 'package'] },
    aerialPhoto: { name: 'Aerial Photography',  price: 115, minutes: 20, primary: true, modes: ['alacarte'], note: 'Drone photos only, no ground photos' },
    aerialVideo: { name: 'Aerial Video',        price: 50,  minutes: 15, requires: 'aerialPhoto', modes: ['alacarte'], note: 'Add-on to aerial photography' },
    droneAddon:  { name: 'Drone Coverage',      prices: [35, 50, 50, 50], minutes: 20, modes: ['package', 'alacarte'], requiresAny: ['hdr', 'video', 'tour3d'], note: 'Aerial photos added to your shoot' },
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

  // Interior design and commercial work are quote-based (request form, not online booking).
  const INTERIORS = {
    packages: [
      { id: 'single', name: 'Single Space', price: 375, size: '1–2 rooms', includes: ['Up to 2 hours on site', '10 edited images', 'Detail and vignette shots'] },
      { id: 'half', name: 'Half Day', price: 695, size: 'Up to 5 rooms', mostBooked: true, includes: ['Up to 4 hours on site', '20 edited images', 'Wide, detail and vignette shots'] },
      { id: 'full', name: 'Full Project', price: 1250, size: 'Whole home or project', includes: ['Up to 8 hours on site', '40 edited images', 'Interiors, exteriors and details'] },
    ],
    addons: [
      ['Additional edited image', 30, 'each'],
      ['Twilight exterior', 110, 'captured at sunset'],
      ['Walkthrough reel', 225, 'vertical video for social'],
      ['Shared license', 175, 'per additional company, such as a builder or vendor'],
    ],
  };
  const COMMERCIAL = {
    packages: [
      { id: 'small', name: 'Small Commercial', price: 450, size: 'Up to 5,000 sq ft', includes: ['25 edited photos', '5 drone aerials', 'Retail suite, restaurant or small office'] },
      { id: 'mid', name: 'Mid-Size', price: 750, size: '5,000–20,000 sq ft', mostBooked: true, includes: ['35 edited photos', '10 drone aerials', 'Interiors, exteriors and site'] },
      { id: 'large', name: 'Large', price: 1150, size: '20,000–50,000 sq ft', includes: ['50 edited photos', '15 drone aerials', 'Buildings, lots and surroundings'] },
    ],
    customFrom: 1500, // 50,000+ sq ft, campuses, multiple buildings
    addons: [
      ['Leasing video', 450, '60–90 seconds'],
      ['Drone video', 175, 'aerial footage of the property and area'],
      ['Twilight', 150, 'exterior at sunset'],
      ['3D virtual tour', 350, 'from'],
      ['Floor plan', 125, 'per floor'],
      ['Shared license', 175, 'per additional company'],
    ],
    types: ['Office', 'Retail', 'Restaurant', 'Industrial or flex', 'Multifamily', 'Land', 'Medical', 'Other'],
  };

  // Home builders (quote-based, sent from the /builders lookbook). Approved Nov 6, 2026.
  // Each price: [1–4 homes a month, 5+ homes a month]. Plans lock the volume rate.
  const BUILDERS = {
    sizes: ['Up to 2,500 sq ft', '2,500–3,999 sq ft', '4,000+ sq ft'],
    spec: { name: 'Spec home', includes: ['25–30 HDR photos', 'Drone', 'Floor plan'], prices: [[295, 275], [370, 350], [445, 425]] },
    model: { name: 'Model home', includes: ['40–50 HDR photos', 'Video, horizontal + vertical', 'Matterport 3D tour', 'Floor plan', 'Drone'], prices: [[650, 550], [725, 625], [800, 700]] },
    addons: [
      ['Matterport 3D tour on a spec home', [100, 75]],
      ['Virtual staging', [15, 15], 'per photo'],
      ['Twilight exteriors, 5 images', [100, 100]],
      ['Video licensed for TV or streaming ads', [150, 150]],
    ],
    community: [
      ['Community aerials', 250, '15–20 drone photos'],
      ['Community aerials + flyover video', 350, ''],
      ['Amenity center shoot', 450, '25 photos + aerials'],
      ['Construction progress', 150, 'monthly drone visit'],
    ],
    plans: [
      { id: 'spec', name: 'Spec Plan', price: 1375, includes: ['5 spec homes a month', 'Volume rate locked in', 'Priority scheduling'] },
      { id: 'community', name: 'Community Plan', price: 2750, value: 3080, mostBooked: true, includes: ['8 spec homes a month', '1 model home', '2 social reels', 'Priority scheduling'] },
    ],
  };

  // Cancellation fees (billed manually): cancelled on the day of the shoot, or after Alex has arrived.
  const POLICY = { cancelSameDay: 75, cancelOnSite: 100 };

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
    const pkg = mode === 'package' ? PACKAGES.find((p) => p.id === selection.packageId) : null;
    const keys = Array.from(new Set((selection.items || []).filter((k) => ITEMS[k] && ITEMS[k].modes.includes(mode) && (!pkg || pkg.extras.includes(k)))));
    const custom = tier >= TIERS.length;
    const lines = [];
    let minutes = 0;
    let includesTwilight = false;

    if (mode === 'package') {
      if (!pkg) return { ok: false, error: 'Choose a package.' };
      if (sqft > PACKAGE_MAX) return { ok: false, error: `Packages cover homes up to ${PACKAGE_MAX.toLocaleString('en-US')} sq ft. Larger estates are custom quoted: choose Build your own.` };
      if (sqft > pkg.max) return { ok: false, error: `${pkg.name} covers homes up to ${pkg.max.toLocaleString('en-US')} sq ft.` };
      lines.push({ key: pkg.id, name: `${pkg.name} Package`, amount: pkg.price });
      minutes += pkg.minutes || PACKAGE_MINUTES(tier);
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
    const customQuote = (mode === 'alacarte' && custom) || priced.length !== lines.length;
    const subtotal = customQuote ? null : priced.reduce((s, l) => s + l.amount, 0);
    const tax = customQuote ? null : Math.round(subtotal * TAX_RATE * 100) / 100;
    if (!customQuote && tax > 0) lines.push({ key: 'tax', name: `Tax (${+(TAX_RATE * 100).toFixed(2)}%)`, amount: tax, from: false });
    const total = customQuote ? null : Math.round((subtotal + tax) * 100) / 100;
    return { ok: true, tier, mode, lines, subtotal, tax, total, customQuote, minutes, includesTwilight };
  }

  // What an Estate package's contents cost booked one by one at its largest size (published prices):
  // HDR + video + reels + drone + aerial video + twilight + floor plan.
  function separatePrice(p) {
    const t = tierFor(p.max);
    return pick(ITEMS.hdr.prices, t) + pick(ITEMS.video.prices, t) + CONTENT.plans[0].price * (p.reels || 1) +
      pick(ITEMS.droneAddon.prices, t) + ITEMS.aerialVideo.price + ITEMS.twilight.price + ITEMS.floorplan.price;
  }

  const api = { TIERS, PACKAGES, PACKAGE_MAX, packageFor, separatePrice, ITEMS, CONTENT, INTERIORS, COMMERCIAL, BUILDERS, POLICY, SCHEDULE, TAX_RATE, SAMEDAY_LATEST, tierFor, quote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MarzPricing = api;
})(typeof window !== 'undefined' ? window : globalThis);
