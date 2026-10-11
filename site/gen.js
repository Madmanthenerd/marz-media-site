async () => {
const SITE_ID = 'abf9c33c-d881-4f10-a57a-eea55ef3c089';
const COMMIT = 'f891af9858920fa5fc10cdfb0af9f9642342cc79';
const LIVE = false;
const CDN = `https://cdn.jsdelivr.net/gh/Madmanthenerd/marz-media-site@${COMMIT}`;
const ORIGIN = 'https://www.marzmediaphotography.com';
const PHONE = '346-533-4026', TEL = '+13465334026', EMAIL = 'admin@marzmediaphotography.com';
const IG = 'https://www.instagram.com/marzmediaphotography/';
/* ---------- media ---------- */
const rows = files.find((f) => f.path === 'catalog.tsv').content.trim().split('\n').map((l) => l.trim().match(/^(\S+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/)).filter(Boolean).map((m) => {
  const [, id, w, h, album, subject] = m;
  return { id, w: +w, h: +h, album, subject: subject.trim() };
});
const byKey = (k) => rows.find((r) => r.id.includes(k));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function src(r, W) {
  const H = Math.round(W * r.h / r.w);
  return `https://static.wixstatic.com/media/${r.id}/v1/fill/w_${W},h_${H},al_c,q_80,enc_auto/${slug(r.subject)}-houston-real-estate-photography.jpg`;
}
const KW = ['luxury real estate photography in Houston, TX', 'Houston real estate photography', 'luxury home photography, Houston',
  'HDR real estate photography for a Houston listing', 'interior photography, Houston, TX', 'architectural and real estate photography, Greater Houston'];
const alt = (r, i) => `${cap(r.subject)}: ${KW[i % KW.length]} by Marz Media Photography`;
const img = (r, W, i = 0, extra = '') => `<img src="${src(r, W)}" alt="${alt(r, i)}" width="${W}" height="${Math.round(W * r.h / r.w)}" loading="lazy" decoding="async"${extra}>`;
const isKitchen = (r) => /kitchen|cooktop/.test(r.subject);
const albumOf = (r) => r.album === 'interior' ? (isKitchen(r) ? 'interiors kitchens' : 'interiors') : r.album === 'exterior' ? 'exteriors' : 'design';
const fig = (r, i, W = 900) => `<figure data-album="${albumOf(r)}" tabindex="0">${img(r, W, i)}<figcaption>${cap(r.subject)}</figcaption></figure>`;

const REELS = [
  ['e4f0495d87a54f1f867467940c12c03e', 'Slow-motion detail reel'], ['7cd86b1381a044e5990c49c9e9456c02', 'Listing reel'],
  ['937811427ce245758f5b43564aea9418', 'Cinematic walkthrough'], ['100ae210b3d84ddeabbe272afee3fc57', 'Luxury listing reel'],
  ['0ea959d93f07412ca28749c6c56b8794', 'Interior walkthrough'], ['52d681b1aec648fe941044c5dd2d9fa0', 'Social-first reel'],
  ['10516c15e3674e90ba97dc2cffca51e6', 'Listing teaser'], ['abed6b8a2dc64883abefe6262f699cfe', 'Cinematic reel'],
  ['20ca86a6a53e46e7a9e584e2cb7a7f77', 'Property tour reel'], ['c03971709c4b4d73a9b25cd2736577da', 'Lifestyle reel'],
  ['61264361ec434deebec351b0aced17e2', 'Listing highlight reel'],
];
const reel = ([id, t]) => `<div class="reel" tabindex="0" role="button" aria-label="Play: ${t}, real estate video in Houston"><video muted playsinline loop preload="none" poster="https://static.wixstatic.com/media/3f0f07_${id}f002.jpg/v1/fill/w_360,h_640,al_c,q_80,enc_auto/houston-real-estate-video-reel.jpg" data-src="https://video.wixstatic.com/video/3f0f07_${id}/720p/mp4/file.mp4"></video><span class="tag">${t}</span><span class="play" aria-hidden="true"></span></div>`;

/* ---------- areas ---------- */
const AREAS = [
  { slug: 'river-oaks', name: 'River Oaks', img: '4f28507a', blurb: 'River Oaks is one of Houston’s most established estate neighborhoods, where landmark homes, mature live oaks and formal gardens set the standard for the city’s luxury market. Listings here are judged on detail and craftsmanship, so the photography has to carry the same polish.', focus: 'Estate exteriors, formal rooms, grounds and twilight.' },
  { slug: 'memorial', name: 'Memorial', img: '1224ba40', blurb: 'From the Memorial Villages to the homes along Buffalo Bayou, Memorial is known for large wooded lots and custom construction. Light under a heavy tree canopy is tricky, which is where careful HDR work and aerial coverage earn their keep.', focus: 'Wooded lots, custom builds, aerial context.' },
  { slug: 'west-university-place', name: 'West University Place', img: '53eeb97a', blurb: 'West U is a small, tree-lined city inside Houston near Rice University, where new custom homes sit beside classic originals. Buyers here compare finishes closely, so clean, true-to-life interiors matter.', focus: 'New construction, finishes, natural-light interiors.' },
  { slug: 'the-woodlands', name: 'The Woodlands', img: '3ee3861a', blurb: 'The Woodlands is a forested master-planned community north of Houston, with waterfront homes on Lake Woodlands, golf-course lots and a deep luxury segment. Location and lifestyle sell here as much as square footage.', focus: 'Waterfront and golf lots, lifestyle video, drone.' },
  { slug: 'katy-cinco-ranch', name: 'Katy & Cinco Ranch', img: '66f29cfc', blurb: 'West of the city, Katy and Cinco Ranch are home to some of the region’s most active master-planned communities, with a steady flow of family homes and upscale new construction. Fast turnaround keeps listings moving in a busy market.', focus: 'Volume-ready packages, next-day photos.' },
  { slug: 'cypress', name: 'Cypress, Bridgeland & Towne Lake', img: 'c4e2cfe7', blurb: 'Cypress is home base for Marz Media. Bridgeland and Towne Lake, with its large recreational lake, bring lakefront and resort-style properties to northwest Houston, and amenities buyers want to see from above.', focus: 'Lakefront homes, amenities, aerial coverage.' },
  { slug: 'sugar-land', name: 'Sugar Land', img: 'e426cebe', blurb: 'Sugar Land, in Fort Bend County, pairs established lake communities with newer luxury developments. Listings here benefit from polished interiors and exteriors that show off water views and outdoor living.', focus: 'Lake communities, outdoor living, interiors.' },
  { slug: 'tomball', name: 'Tomball', img: 'db167043', blurb: 'Tomball and the surrounding area offer acreage, estate lots and room to spread out, with plenty of new custom homes. Aerial photography and video show buyers the land, not just the house.', focus: 'Acreage, estate lots, drone photo and video.' },
  { slug: 'bellaire', name: 'Bellaire', img: '3eedf93f', blurb: 'Bellaire is a small city within southwest Houston known for its new-construction homes and convenient location. Contemporary kitchens, open plans and clean architecture photograph best with precise, bright HDR.', focus: 'New construction, kitchens, architectural detail.' },
  { slug: 'houston-heights', name: 'Houston Heights', img: '6e038479', blurb: 'The Heights blends restored Victorians and bungalows with modern infill on walkable, tree-lined streets. Character homes need photography that respects original detail while making rooms feel open and bright.', focus: 'Historic character, modern infill, walkability.' },
];
const OTHER_AREAS = ['Tanglewood', 'Uptown & the Galleria', 'Spring', 'Kingwood', 'Fulshear', 'Pearland', 'Missouri City', 'Montrose', 'Bunker Hill Village', 'Hunters Creek Village', 'Piney Point Village', 'Fairfield', 'Jersey Village'];

/* ---------- shared chrome ---------- */
const NAV = [['portfolio.html', 'Portfolio'], ['services.html', 'Services & pricing'], ['about.html', 'About'], ['prep.html', 'Prep guide']];
const BIZ = {
  '@context': 'https://schema.org', '@type': ['ProfessionalService', 'LocalBusiness'], '@id': ORIGIN + '/#business',
  name: 'Marz Media Photography', url: ORIGIN + '/', telephone: TEL, email: EMAIL,
  image: src(byKey('3ee3861a'), 1600), logo: src(byKey('3ee3861a'), 600), priceRange: '$$',
  description: 'Luxury real estate photography, cinematic video, drone and 3D tours across Greater Houston.',
  address: { '@type': 'PostalAddress', addressLocality: 'Cypress', addressRegion: 'TX', addressCountry: 'US' },
  founder: { '@type': 'Person', name: 'Alex Marzette' }, sameAs: [IG],
  areaServed: ['Houston', ...AREAS.map((a) => a.name), ...OTHER_AREAS].map((n) => ({ '@type': 'Place', name: n + ', TX' })),
  knowsAbout: ['Real estate photography', 'Real estate videography', 'Luxury property photography', 'Interior design photography', 'Drone photography', '3D virtual tours', 'Twilight photography'],
};
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

function head({ file, title, desc, image, extra = '' }) {
  const url = ORIGIN + '/' + (file === 'index.html' ? '' : file);
  return `<!doctype html><html lang="en" class="no-js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title><meta name="description" content="${desc}">${LIVE ? '' : '<meta name="robots" content="noindex,nofollow">'}
<link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="Marz Media Photography"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#07090E">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2307090E'/%3E%3Ctext x='32' y='44' font-family='Georgia,serif' font-size='34' fill='%23fff' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://static.wixstatic.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Manrope:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${CDN}/site/assets/styles.css">${ld(BIZ)}${extra}</head>`;
}
function header(file, light) {
  return `<body><a class="skip" href="#main">Skip to content</a><header class="site-head${light ? ' light' : ''}"><div class="wrap bar"><a class="brand" href="index.html" aria-label="Marz Media Photography home">Marz<span>Media</span></a>
<button class="menu-btn" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button><nav class="nav" aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}"${h === file ? ' aria-current="page"' : ''}>${t}</a>`).join('')}<a class="btn btn-primary" href="book.html">Book a shoot</a></nav></div></header>`;
}
const footer = (scripts = '') => `<footer class="site-foot"><div class="wrap top"><div><p class="big">Real estate media for Houston’s finest homes.</p><p>Photography, cinematic video, drone and 3D tours. Shot by Alex Marzette, FAA-certified drone pilot and licensed Texas real estate agent.</p><p><a class="btn btn-light" href="book.html">Book a shoot <span class="arr">→</span></a></p></div>
<div><h4>Services</h4><ul><li><a href="services.html#packages">Listing packages</a></li><li><a href="services.html#a-la-carte">HDR photography</a></li><li><a href="services.html#a-la-carte">Cinematic video</a></li><li><a href="services.html#a-la-carte">Drone & aerial</a></li><li><a href="services.html#a-la-carte">3D virtual tours</a></li><li><a href="services.html#content">Social media reels</a></li><li><a href="services.html#content">Monthly content plans</a></li></ul></div>
<div><h4>Areas</h4><ul>${AREAS.slice(0, 6).map((a) => `<li><a href="${a.slug}.html">${a.name}</a></li>`).join('')}<li><a href="houston.html">All of Houston</a></li></ul></div>
<div><h4>Contact</h4><ul><li><a href="tel:${TEL}">${PHONE}</a></li><li><a href="mailto:${EMAIL}">${EMAIL}</a></li><li><a href="${IG}" rel="noopener">Instagram</a></li><li>Based in Cypress, TX</li><li><a href="prep.html">Prepare your home</a></li></ul></div></div>
<div class="wrap base"><span>© <span id="year">2026</span> Marz Media Photography · Houston, Texas · <a href="privacy.html">Privacy</a> · <a href="accessibility.html">Accessibility</a></span><span>Luxury real estate photography & video</span></div></footer>
<script src="${CDN}/site/assets/site.js" defer></script>${scripts}</body></html>`;

function hero(r, { eyebrow, h1, lede, actions = '', facts = '', short = false, crumbs = '' }) {
  return `<section class="hero${short ? ' short' : ''}"><div class="bg"><img src="${src(r, 2400)}" alt="${alt(r, 0)}" width="2400" height="${Math.round(2400 * r.h / r.w)}" fetchpriority="high"></div><div class="wrap">${crumbs}${eyebrow ? `<span class="eyebrow" style="color:rgba(238,241,246,.8)">${eyebrow}</span>` : ''}<h1>${h1}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}${facts}</div></section>`;
}
const BTN_BOOK = '<a class="btn btn-light" href="book.html">Book a shoot <span class="arr">→</span></a>';
const BTN_PORT = '<a class="btn btn-ghost" href="portfolio.html">View portfolio</a>';
const cta = (r, h2 = 'Your next listing deserves to look like this.', lede = 'Live availability and simple pricing by square footage.') =>
  `<section class="cta-band"><img src="${src(r, 2000)}" alt="" width="2000" height="${Math.round(2000 * r.h / r.w)}" loading="lazy"><div class="wrap"><h2 class="rv">${h2}</h2><p class="lede rv d1">${lede}</p><div class="rv d2">${BTN_BOOK}</div></div></section>`;
const ticker = () => { const items = [...AREAS.map((a) => `<a href="${a.slug}.html">${a.name}</a>`), ...OTHER_AREAS.slice(0, 6).map((n) => `<a href="houston.html">${n}</a>`)].join(''); return `<div class="ticker" aria-label="Areas served"><div class="track">${items}${items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div></div>`; };

const P = {
  PACKAGES: [
    { id: 'essential', name: 'Essential', price: 349, max: 2499, includes: ['HDR photography', 'Cinematic video or reel', '1 twilight photo'] },
    { id: 'pro', name: 'Pro', price: 449, max: 3999, mostBooked: true, includes: ['HDR photography', 'Cinematic video or reel', '2 twilight photos'] },
    { id: 'signature', name: 'Signature', price: 599, max: 5999, includes: ['HDR photography', 'Cinematic video or reel', '2 twilight photos', 'Priority scheduling'] },
  ],
  ITEMS: {
    hdr: { name: 'HDR Photography', prices: [165, 210, 260] },
    video: { name: 'Cinematic Video', prices: [225, 275, 325] },
    tour3d: { name: '3D Virtual Tour', prices: [225, 275, 325] },
  },
  CONTENT: {
    plans: [
      { id: 'reel1', name: 'Single Reel', price: 165, reels: 1, desc: 'One 30–60 second vertical reel' },
      { id: 'reel2', name: 'Double Reel', price: 279, reels: 2, desc: 'Two different reels from one shoot' },
      { id: 'monthly4', name: 'Monthly 4', price: 599, reels: 4, monthly: true },
      { id: 'monthly6', name: 'Monthly 6', price: 849, reels: 6, monthly: true },
      { id: 'monthly8', name: 'Monthly 8', price: 1049, reels: 8, monthly: true },
    ],
    drone: { price: 35 },
    minMonths: 3,
    purposes: ['Agent or personal brand', 'Business or product', 'Restaurant or venue', 'Event', 'Other'],
  },
};
const money = (n) => '$' + n.toLocaleString('en-US');
const PKG_DESC = { essential: 'Homes up to 2,499 sq ft', pro: '2,500–3,999 sq ft', signature: '4,000–5,999 sq ft' };
const tiers = () => `<div class="tiers">${P.PACKAGES.map((p, i) => `<article class="tier${p.mostBooked ? ' feature' : ''} rv d${i + 1}"><span class="badge">${p.mostBooked ? 'Most booked' : 'Listing package'}</span><h3>${p.name}</h3><div class="price">${money(p.price)}</div><span class="size">${PKG_DESC[p.id]}</span><ul>${p.includes.map((x) => `<li>${x}</li>`).join('')}</ul><a class="btn ${p.mostBooked ? '' : 'btn-primary'}" href="book.html?package=${p.id}">Book ${p.name}</a></article>`).join('')}</div>`;

/* ---------- pages ---------- */
const pages = {};
const SERVICES_LIST = [
  ['HDR Photography', 'Bright, true-to-life interiors and exteriors, color-corrected and delivered the next business day.', 'from $165'],
  ['Cinematic Video & Reels', 'Smooth, story-driven listing films and vertical reels made for MLS, Instagram and TikTok.', 'from $225'],
  ['Drone & Aerial', 'FAA-certified aerial photo and video that shows the lot, the neighborhood and the lifestyle.', 'from $115'],
  ['3D Virtual Tours', 'Immersive walkthroughs buyers can explore from anywhere, any time.', 'from $225'],
  ['Twilight Photography', 'The sunset hero shot that stops the scroll and lifts the whole listing.', '$75'],
  ['Floor Plans', 'Clear, accurate layouts that answer buyers’ first question.', '$50'],
  ['Social Media Reels', 'Vertical reels for agents, brands and businesses. Single reels, or a monthly plan with drone included.', 'from $165'],
];

// HOME
{
  const H = byKey('3ee3861a'), feat = ['4f28507a', 'f03180ea', 'a4abd4f7', '66f29cfc', '53eeb97a', '4cbca1ea', '89becc90', '3eedf93f', '860a3a1c'].map(byKey);
  pages['index.html'] = head({ file: 'index.html', title: 'Luxury Real Estate Photography & Video in Houston, TX | Marz Media', desc: 'Luxury real estate photography, cinematic video, drone and 3D tours across Houston, from River Oaks and Memorial to The Woodlands and Katy. Photos next business day.', image: src(H, 1600) }) +
    header('index.html') + `<main id="main">` +
    hero(H, { eyebrow: 'Houston real estate media', h1: 'Luxury listings, captured beautifully.', lede: 'Photography, cinematic video, drone and 3D tours for agents, builders and designers across Greater Houston. Shot by Alex Marzette, start to finish.', actions: BTN_BOOK + BTN_PORT, facts: '<ul class="facts"><li>Photos next business day</li><li>Video in 24–72 hours</li><li>FAA-certified drone pilot</li><li>All of Greater Houston</li></ul>' }) +
    `<section class="section"><div class="wrap split wide-left"><div><span class="eyebrow rv">Marz Media Photography</span><h2 class="rv d1">Media that sells the home before the first showing.</h2><p class="lede rv d2">Buyers decide in the first few photos. Every shoot is planned around light, composition and the story of the home, then delivered fast so your listing goes live on time.</p><p class="rv d2"><a class="link" href="about.html">Meet Alex</a></p></div><div class="figure wide rv d1">${img(byKey('1224ba40'), 1200, 1)}</div></div>
<div class="wrap"><div class="creds rv"><div><strong>Licensed agent</strong><span>A Texas real estate agent behind the camera, who knows what moves a listing.</span></div><div><strong>FAA-certified</strong><span>Legal, insured-minded drone work for aerial photo and video.</span></div><div><strong>Next-day photos</strong><span>Edited photos the next business day; video in 24–72 hours.</span></div><div><strong>One point of contact</strong><span>Alex shoots every job himself, so quality never changes hands.</span></div></div></div></section>` +
    `<section class="section paper"><div class="wrap"><span class="eyebrow rv">Services</span><h2 class="rv d1" style="max-width:16ch">Everything a premium listing needs.</h2><div class="svc" style="margin-top:48px">${SERVICES_LIST.map(([t, d, p]) => `<a class="rv" href="services.html"><h3>${t}</h3><span class="from">${p}</span><p>${d}</p></a>`).join('')}</div></div></section>` +
    `<section class="section"><div class="wrap"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:20px;margin-bottom:40px"><div><span class="eyebrow rv">Portfolio</span><h2 class="rv d1">Recent work.</h2></div><a class="link rv" href="portfolio.html">See the full portfolio →</a></div><div class="mosaic" data-lb>${feat.map((r, i) => fig(r, i)).join('')}</div></div></section>` +
    `<section class="section on-dark"><div class="wrap"><span class="eyebrow rv">Video & reels</span><h2 class="rv d1" style="max-width:18ch">Cinematic video, made for the feed.</h2><p class="lede rv d2">Vertical reels and listing films that put your property in front of buyers where they scroll. Hover or tap to play.</p><div class="reels rv" style="margin-top:40px">${REELS.slice(0, 6).map(reel).join('')}</div><p style="margin-top:24px"><a class="link" href="portfolio.html#reels">All reels →</a></p></div></section>` +
    `<section class="section"><div class="wrap"><span class="eyebrow rv">How it works</span><h2 class="rv d1">Simple from start to finish.</h2><ol class="steps"><li class="rv"><h3>Book online</h3><p>Enter the square footage, choose a package and pick a live time slot.</p></li><li class="rv d1"><h3>Prep the home</h3><p>Use the <a class="link" href="prep.html">prep checklist</a>. Lights on, counters clear.</p></li><li class="rv d2"><h3>Shoot day</h3><p>Alex arrives on time, works efficiently and leaves the home as he found it.</p></li><li class="rv d3"><h3>Delivery</h3><p>Photos next business day, video in 24–72 hours.</p></li></ol></div></section>` +
    `<section class="section tight paper"><div class="wrap"><span class="eyebrow rv">Pricing</span><h2 class="rv d1">Simple pricing, by square footage.</h2>${tiers()}<p style="margin-top:28px"><a class="link" href="services.html">See à la carte pricing and add-ons →</a></p></div></section>` +
    `<section class="section tight"><div class="wrap"><span class="eyebrow rv">Serving all of Greater Houston</span></div>${ticker()}</section>` +
    cta(byKey('c4e2cfe7')) + `</main>` + footer();
}

// PORTFOLIO
{
  const albums = [['interiors', 'Interiors'], ['kitchens', 'Kitchens'], ['exteriors', 'Exteriors & outdoor living'], ['design', 'Styled interiors'], ['reels', 'Reels']];
  const count = (k) => k === 'reels' ? REELS.length : rows.filter((r) => albumOf(r).split(' ').includes(k)).length;
  const order = [...rows].sort((a, b) => ['exterior', 'interior', 'design'].indexOf(a.album) - ['exterior', 'interior', 'design'].indexOf(b.album));
  // interleave so the grid mixes rooms and exteriors
  const ex = order.filter((r) => r.album === 'exterior'), inn = order.filter((r) => r.album !== 'exterior'), mixed = [];
  while (ex.length || inn.length) { if (inn.length) mixed.push(inn.shift()); if (inn.length) mixed.push(inn.shift()); if (ex.length) mixed.push(ex.shift()); }
  const H = byKey('1224ba40');
  pages['portfolio.html'] = head({ file: 'portfolio.html', title: 'Portfolio: Houston Luxury Real Estate Photography & Video | Marz Media', desc: 'Browse luxury real estate photography, interior design photography, exteriors, kitchens and cinematic reels shot across Houston by Marz Media.', image: src(H, 1600),
    extra: ld({ '@context': 'https://schema.org', '@type': 'ImageGallery', name: 'Marz Media Photography portfolio', url: ORIGIN + '/portfolio.html', creator: { '@id': ORIGIN + '/#business' }, image: rows.slice(0, 40).map((r, i) => ({ '@type': 'ImageObject', contentUrl: src(r, 1600), name: cap(r.subject), description: alt(r, i), creator: { '@type': 'Person', name: 'Alex Marzette' }, copyrightHolder: { '@id': ORIGIN + '/#business' } })) }) }) +
    header('portfolio.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Portfolio', h1: 'Homes, told beautifully.', lede: 'Luxury real estate photography, interior design work and cinematic reels from across Greater Houston.' }) +
    `<section class="section tight"><div class="wrap"><div class="filters" data-filters="#gallery" role="group" aria-label="Filter the portfolio"><button data-filter="all" aria-pressed="true">All<span class="n">${rows.length + REELS.length}</span></button>${albums.map(([k, t]) => `<button data-filter="${k}" aria-pressed="false">${t}<span class="n">${count(k)}</span></button>`).join('')}</div>
<div id="gallery"><div id="reels-block" style="margin-bottom:48px"><h2 style="font-size:28px;margin-bottom:20px">Reels</h2><div class="reels">${REELS.map(reel).join('')}</div></div><div id="photo-block"><div class="mosaic" data-lb>${mixed.map((r, i) => fig(r, i)).join('')}</div></div></div></div></section>` +
    cta(byKey('3ee3861a'), 'Like what you see?', 'Book your listing online with live availability.') + `</main>` + footer();
}

// SERVICES
{
  const H = byKey('4f28507a');
  const FAQ = [
    ['How fast will I get my photos?', 'Edited photos are delivered the next business day. Video is delivered within 24–72 hours. Same-day delivery is available for $75 when the shoot starts between 8 and 9 AM.'],
    ['How is pricing set?', 'By the home’s heated square footage as listed on HAR or MLS: up to 2,499, 2,500–3,999 and 4,000–5,999 sq ft. Homes of 6,000 sq ft and up are custom quoted.'],
    ['Do you fly drones legally?', 'Yes. Alex is an FAA-certified drone pilot and checks airspace and any HOA restrictions before every aerial shoot.'],
    ['When are twilight photos taken?', 'Around sunset on the day of your shoot. Alex confirms the timing with you after booking.'],
    ['What areas do you serve?', 'All of Greater Houston, including River Oaks, Memorial, West University Place, Bellaire, The Heights, The Woodlands, Katy, Cypress, Sugar Land and Tomball.'],
    ['Do you shoot reels for businesses, not just listings?', 'Yes. Social media reels start at $165 for agents, businesses, restaurants and events, with drone footage for +$35. Monthly content plans start at $599 for 4 reels a month with drone included.'],
    ['How should I prepare the home?', 'Turn on every light, open blinds, clear counters and move cars from the driveway. The full room-by-room checklist is on the prep guide.'],
  ];
  const row = (k) => { const it = P.ITEMS[k]; return `<tr><td>${it.name}</td>${it.prices.map((p) => `<td>${money(p)}</td>`).join('')}<td>Quote</td></tr>`; };
  pages['services.html'] = head({ file: 'services.html', title: 'Real Estate Photography Pricing & Services in Houston | Marz Media', desc: 'Listing packages from $349, HDR photography, cinematic video, drone, 3D tours, twilight and floor plans. Simple square-footage pricing across Houston.', image: src(H, 1600),
    extra: ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }) +
      ld({ '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'Real estate media packages', itemListElement: P.PACKAGES.map((p) => ({ '@type': 'Offer', name: p.name + ' listing package', price: p.price, priceCurrency: 'USD', description: p.includes.join(', ') + '. ' + PKG_DESC[p.id] + '.', seller: { '@id': ORIGIN + '/#business' } })) }) }) +
    header('services.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Services & pricing', h1: 'Simple pricing. Premium results.', lede: 'Every price is set by square footage and shown up front.', actions: BTN_BOOK }) +
    `<section class="section" id="packages"><div class="wrap"><span class="eyebrow rv">Listing packages</span><h2 class="rv d1">Photo, video and twilight in one visit.</h2><p class="lede rv d2">Add drone coverage to any package from $35, plus 3D tours, floor plans or same-day delivery.</p>${tiers()}</div></section>` +
    `<section class="section paper" id="a-la-carte"><div class="wrap"><span class="eyebrow rv">À la carte</span><h2 class="rv d1">Build exactly what you need.</h2><div class="rate-wrap rv"><table class="rate"><thead><tr><th>Service</th><th>Up to 2,499 sq ft</th><th>2,500–3,999</th><th>4,000–5,999</th><th>6,000+</th></tr></thead><tbody>${row('hdr')}${row('video')}${row('tour3d')}<tr><td>Aerial Photography</td><td colspan="4">$115 · add aerial video for +$50</td></tr></tbody></table></div>
<h3 class="rv" style="margin-top:56px">Add-ons</h3><div class="addons rv"><div><strong>Drone coverage <span>$35–$50</span></strong><span>Added to a listing package: $35 under 2,500 sq ft, $50 above</span></div><div><strong>Twilight photography <span>$75</span></strong><span>Captured at sunset</span></div><div><strong>Floor plans <span>$50</span></strong><span>Clean, accurate layouts</span></div><div><strong>Same-day delivery <span>$75</span></strong><span>Photos the same evening, for 8–9 AM shoots</span></div></div></div></section>` +
    `<section class="section on-dark" id="content"><div class="wrap"><span class="eyebrow rv">Social media reels</span><h2 class="rv d1" style="max-width:20ch">Reels for your brand, not just your listings.</h2><p class="lede rv d2">Vertical content for agents, businesses, restaurants and events, shot and edited for Instagram, TikTok and YouTube Shorts. No listing needed.</p><div class="tiers rv" style="margin-top:40px">${P.CONTENT.plans.filter((p) => !p.monthly).map((p) => `<article class="tier" style="background:transparent;color:var(--on-dark);border-color:rgba(255,255,255,.2)"><span class="badge" style="color:#9DB4E0">${p.reels === 1 ? 'Start here' : 'Best value per shoot'}</span><h3>${p.name}</h3><div class="price">${money(p.price)}</div><span class="size">${p.desc}</span><ul><li>Up to 1 hour on location</li><li>Music, captions-ready, edited in-house</li><li>Delivered within 3 business days</li><li>Drone footage +${money(P.CONTENT.drone.price)}</li></ul><a class="btn btn-light" href="book.html?type=content&amp;plan=${p.id}">Book ${p.name}</a></article>`).join('')}<article class="tier" style="background:transparent;color:var(--on-dark);border-color:rgba(255,255,255,.2)"><span class="badge" style="color:#9DB4E0">Every month</span><h3>Monthly content</h3><div class="price">${money(P.CONTENT.plans.find((p) => p.monthly).price)}<small style="font-size:18px">/mo</small></div><span class="size">From 4 reels a month, drone included</span><ul>${P.CONTENT.plans.filter((p) => p.monthly).map((p) => `<li>${p.reels} reels / month · ${money(p.price)}</li>`).join('')}<li>${P.CONTENT.minMonths}-month minimum</li></ul><a class="btn btn-light" href="book.html?type=content&amp;plan=monthly6">Start a plan</a></article></div></div></section>` +
    `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">Good to know</span><h2 class="rv d1">Booking policies.</h2></div><div class="prose rv"><ul><li><strong>Arrival times</strong> are in Houston time. Packages take about two hours on site; photo-only shoots about an hour.</li><li><strong>Homes of 6,000+ sq ft</strong> are custom quoted. You can still reserve your time online.</li><li><strong>Weather.</strong> Drone and twilight work depend on conditions; Alex will reschedule those parts with you if needed.</li><li><strong>Prep matters.</strong> Please follow the <a href="prep.html">prep checklist</a> before we arrive.</li></ul></div></div></section>` +
    `<section class="section paper"><div class="wrap split"><div><span class="eyebrow rv">FAQ</span><h2 class="rv d1">Questions, answered.</h2></div><div class="faq rv">${FAQ.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a.replace('prep guide', '<a class="link" href="prep.html">prep guide</a>')}</p></details>`).join('')}</div></div></section>` +
    cta(byKey('66f29cfc')) + `</main>` + footer();
}

// BOOK
pages['book.html'] = head({ file: 'book.html', title: 'Book a Real Estate Photo or Video Shoot in Houston | Marz Media', desc: 'Book Houston real estate photography, video, drone, 3D tours and social media reels online with live availability.', image: src(byKey('3ee3861a'), 1600) }) +
  header('book.html', true) + `<main id="main" style="padding-top:76px"><div id="app" class="wrap"><div style="padding-top:48px"><span class="eyebrow">Book online</span><h1 style="font-size:clamp(40px,6vw,72px)">Book your shoot.</h1><ul class="hero-facts" style="display:flex;flex-wrap:wrap;gap:8px 26px;list-style:none;padding:0;margin:20px 0 0;color:var(--muted);font-size:14px"><li>Live availability</li><li>Photos next business day</li><li>Video in 24–72 hours</li></ul><div class="seg kind" role="group" aria-label="What are you booking?"><button type="button" id="kindListing" aria-pressed="true">Listing shoot</button><button type="button" id="kindContent" aria-pressed="false">Social media reels</button></div></div>
<form class="bk-grid" id="form" novalidate><div>
<section class="step" aria-labelledby="h1s"><div class="step-h"><span class="step-n">01</span><h2 id="h1s">The property</h2></div>
<div class="field" id="purposeField" hidden><label for="purpose">What’s it for?</label><select id="purpose">${P.CONTENT.purposes.map((x) => `<option>${x}</option>`).join('')}</select></div>
<div class="field"><label for="address" id="addrLabel">Property address</label><input type="text" id="address" autocomplete="street-address" placeholder="Start typing the address"></div>
<div class="field" id="sqftField"><label for="sqft">Heated square footage</label><input type="number" id="sqft" inputmode="numeric" min="100" step="1" placeholder="e.g. 3200"><div class="ruler" aria-hidden="true"><div class="bands"><div class="band">Essential</div><div class="band">Pro</div><div class="band">Signature</div><div class="band">Estate</div><div class="pin" id="pin" hidden></div></div><div class="ticks"><span>0</span><span>2,500</span><span>4,000</span><span>6,000+</span></div></div><p class="hint" id="tierHint"></p></div></section>
<section class="step"><div class="step-h"><span class="step-n">02</span><h2 id="h2" tabindex="-1">What you need</h2></div><div id="contentNeeds" hidden><p class="subh" style="margin-top:0">Reels</p><div class="pkgs two" id="plansOne" role="radiogroup" aria-label="Reel options"></div><div class="opts" id="contentExtras" style="margin-top:12px"></div><p class="subh">Monthly content plans</p><div class="pkgs" id="plansMonthly" role="radiogroup" aria-label="Monthly plans"></div><p class="hint" id="planNote"></p></div><div id="listNeeds"><div class="seg" role="group" aria-label="Booking type"><button type="button" id="modePkg" aria-pressed="true">Listing package</button><button type="button" id="modeAla" aria-pressed="false">Build your own</button></div>
<div id="pkgWrap"><div class="pkgs" id="pkgs" role="radiogroup" aria-label="Packages"></div><p class="subh">Add to your package</p><div class="opts" id="pkgExtras"></div></div>
<div id="alaWrap" hidden><p class="subh" style="margin-top:0">Services</p><div class="opts" id="alaServices"></div><p class="subh">Add-ons</p><div class="opts" id="alaAddons"></div></div></div><p class="err" id="svcErr" hidden></p></section>
<section class="step"><div class="step-h"><span class="step-n">03</span><h2 id="h3" tabindex="-1">Date and time</h2></div><div id="dateGate" class="note">Add the square footage and choose your services to see open times.</div>
<div id="dateBox" hidden><div class="wk"><button type="button" class="wk-btn" id="prevWk" aria-label="Earlier dates">‹</button><div class="days" id="days" role="group" aria-label="Choose a day"></div><button type="button" class="wk-btn" id="nextWk" aria-label="Later dates">›</button></div><div id="slotBox"></div></div><p class="hint" id="twiNote" hidden>Twilight photos are captured around sunset the same day. Alex confirms that timing with you.</p></section>
<section class="step"><div class="step-h"><span class="step-n">04</span><h2>Your details</h2></div><div class="row2">
<div class="field"><label for="fname">First name</label><input type="text" id="fname" autocomplete="given-name"></div><div class="field"><label for="lname">Last name</label><input type="text" id="lname" autocomplete="family-name"></div>
<div class="field"><label for="email">Email</label><input type="email" id="email" autocomplete="email"></div><div class="field"><label for="phone">Mobile</label><input type="tel" id="phone" autocomplete="tel"></div>
<div class="field"><label for="brokerage"><span id="brkLabel">Brokerage</span> <span class="opt-hint">(optional)</span></label><input type="text" id="brokerage" autocomplete="organization"></div><div class="field lst-only"><label for="golive">Listing go-live date <span class="opt-hint">(optional)</span></label><input type="date" id="golive"></div>
<div class="field lst-only"><label for="occupancy">Property status</label><select id="occupancy"><option>Vacant</option><option>Occupied</option></select></div><div class="field lst-only"><label for="access">Access</label><select id="access"><option>Supra lockbox</option><option>Owner present</option><option>Other</option></select></div></div>
<div class="field lst-only"><label for="accessNotes">Access notes <span class="opt-hint">(lockbox, gate code)</span></label><input type="text" id="accessNotes"></div>
<div class="field"><label for="notes">Anything else <span class="opt-hint">(optional)</span></label><textarea id="notes" placeholder="Rooms to feature, HOA rules for drones…"></textarea></div>
<div class="hp" aria-hidden="true"><label for="company">Company</label><input type="text" id="company" tabindex="-1" autocomplete="off"></div></section></div>
<aside class="sum" aria-labelledby="sumh"><h3 id="sumh">Your order</h3><p class="meta" id="sumMeta"></p><ul class="lines" id="sumLines"></ul><p class="empty" id="sumEmpty"></p><div class="tot"><span>Total</span><strong id="sumTotal">$0</strong></div>
<button type="submit" class="btn btn-primary cta" id="submit">Confirm booking</button><p class="err" id="formErr" hidden></p>
<p class="ret">Posting every month? <a href="services.html#content">Monthly content plans</a> start at $599 for 4 reels, drone included. Call or text <a href="tel:${TEL}">${PHONE}</a>.</p></aside></form></div>
<section class="done wrap" id="done" hidden aria-live="polite"></section></main>
<div class="mbar" id="bar"><div class="bt"><small id="barSub">Choose your services</small><strong id="barTotal">$0</strong></div><button type="button" class="btn btn-primary" id="barBtn">Continue</button></div>` +
  footer(`<script src="${CDN}/pricing.js"></script><script type="module" src="${CDN}/site/assets/book.js"></script>`);

// PREP
{
  const H = byKey('ca539374');
  const ROOMS = [
    ['Throughout the home', 'The day before', ['Remove family photos, diplomas and personal mementos, including the refrigerator door', 'Replace burned-out bulbs and use one bulb color throughout', 'Hide cords, chargers, remotes and small electronics', 'Put away shoes, coats, bags and mail from entryways', 'Clean mirrors, glass doors and windows facing the camera', 'Store pet beds, bowls, toys and litter boxes out of sight']],
    ['Kitchen', 'The day before', ['Clear countertops completely; a bowl of fruit or a plant at most', 'Remove soap, sponges, towels and drying racks from the sink', 'Empty the sink and run the dishwasher', 'Remove magnets, papers and calendars from the refrigerator', 'Place trash and recycling bins in the garage']],
    ['Living and dining', 'The day before', ['Straighten and fluff pillows and throws', 'Clear coffee and side tables to a few intentional pieces', 'Set the dining table simply, or clear it entirely', 'Turn televisions off and remove gaming equipment', 'Vacuum rugs and clear the floors']],
    ['Bedrooms', 'The morning of', ['Make every bed with smooth, neutral bedding', 'Clear nightstands except for a lamp', 'Close closet doors; put away laundry and hampers', 'Remove anything stored visibly under beds']],
    ['Bathrooms', 'The morning of', ['Clear vanities of toiletries, toothbrushes and appliances', 'Remove products from the shower and tub', 'Hang one set of fresh matching towels, or none', 'Close toilet lids; remove bath mats and trash cans']],
    ['Exterior and yard', 'The day before', ['Mow, edge and clear leaves from lawn and walkways', 'Store hoses, tools, toys and trash bins out of view', 'Arrange patio furniture and remove covers', 'Clean and uncover the pool or spa; remove cleaning equipment', 'Close the garage door']],
    ['The final hour', 'Before we arrive', ['Turn on every light, including lamps and under-cabinet lights', 'Open all blinds and curtains fully', 'Turn off ceiling fans', 'Move vehicles out of the driveway and away from the front of the home', 'Secure pets away from the property', 'Confirm the lockbox code, gate code, or that someone will be present']],
  ];
  pages['prep.html'] = head({ file: 'prep.html', title: 'How to Prepare Your Home for Real Estate Photos | Marz Media Houston', desc: 'A room-by-room checklist for decluttering and preparing your Houston home before real estate photography, video and drone.', image: src(H, 1600) }) +
    header('prep.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Client guide', h1: 'Preparing your home for photography.', lede: 'The camera records everything in the frame. A short hour of preparation is the single greatest factor in how the finished listing looks.' }) +
    `<section class="section"><div class="wrap split"><div class="prose"><p class="lede rv">We photograph with wide-angle lenses and high-dynamic-range exposures, which reveal far more of a room than the eye notices in person. Small items on counters, cords and personal effects become prominent in the final images.</p></div><div class="creds rv" style="margin-top:0"><div><strong>Clear surfaces</strong><span>Buyers should see space, not belongings.</span></div><div><strong>Every light on</strong><span>Warm, even light reads as welcoming.</span></div><div><strong>Nothing personal</strong><span>Buyers should picture themselves living there.</span></div></div></div></section>` +
    `<section class="section paper"><div class="wrap room-grid">${ROOMS.map(([t, w, items]) => `<div class="rv"><span class="eyebrow">${w}</span><h2 style="font-size:clamp(26px,3vw,34px);margin-bottom:18px">${t}</h2><ul class="check">${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div></section>` +
    `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">Twilight and aerial</span><h2 class="rv d1">A few extras.</h2></div><div class="prose rv"><p>If your order includes twilight photography, please leave every interior and exterior light on through sunset. For drone coverage, we confirm local airspace and any HOA restrictions in advance.</p><p>On arrival, Alex walks the property, makes small adjustments for the camera and works efficiently, so the home is returned to you as it was found. If there is anything you would like featured or avoided, call or text <a href="tel:${TEL}">${PHONE}</a>.</p></div></div></section>` +
    cta(byKey('a6eeb3e9'), 'Ready when you are.') + `</main>` + footer();
}

// ABOUT
{
  const H = byKey('790b5577');
  const ALEX = 'https://static.wixstatic.com/media/3f0f07_62cd129eba1942e593f8cdb9dba24316~mv2.jpg/v1/fill/w_1000,h_1500,al_c,q_82,enc_auto/alex-marzette-houston-real-estate-photographer.jpg';
  const portrait = `<img src="${ALEX}" alt="Alex Marzette, Houston real estate photographer and founder of Marz Media Photography" width="1000" height="1500" loading="lazy" decoding="async" style="object-position:50% 20%">`;
  pages['about.html'] = head({ file: 'about.html', title: 'About Alex Marzette | Marz Media Photography, Houston', desc: 'Meet Alex Marzette: licensed Texas real estate agent, FAA-certified drone pilot and former pro basketball player behind Marz Media Photography in Cypress, serving all of Houston.', image: ALEX,
    extra: ld({ '@context': 'https://schema.org', '@type': 'Person', name: 'Alex Marzette', jobTitle: 'Founder & Photographer', image: ALEX, description: 'Licensed Texas real estate agent, FAA-certified drone pilot and former professional basketball player. Founder of Marz Media Photography in Cypress, Texas.', knowsAbout: ['Real estate photography', 'Real estate videography', 'Drone photography', 'Real estate marketing'], worksFor: { '@id': ORIGIN + '/#business' }, sameAs: [IG] }) }) +
    header('about.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'About', h1: 'An agent’s eye. An athlete’s work ethic.', lede: 'I’m Alex Marzette: licensed Texas real estate agent, FAA-certified drone pilot and former professional basketball player. When you book Marz Media, the person you talk to is the person behind the camera.' }) +
    `<section class="section"><div class="wrap split wide-left"><div class="prose"><span class="eyebrow rv">Alex Marzette, founder</span><h2 class="rv d1" style="margin-top:0">It started with a camera roll full of houses.</h2><p class="rv">Long before I owned a camera, my phone was full of home wallpapers and aerial shots. Whenever I visited a big city like Houston, I’d spend hours driving through neighborhoods just to look at the homes. Real estate always had my attention.</p><p class="rv">I earned my Texas real estate license and bought a camera right after. Three months in, my mentor told me I was further along than he had been at the same point. That’s when I knew I had the eye for this, and I’ve taken it seriously ever since. Four-plus years later, it’s what I do every day.</p><p class="rv"><a class="btn btn-primary" href="book.html">Book a shoot <span class="arr">→</span></a></p></div><div class="figure tall rv d1">${portrait}</div></div>
<div class="wrap"><div class="creds rv"><div><strong>Licensed agent</strong><span>Texas real estate license</span></div><div><strong>FAA-certified</strong><span>Drone photo and video</span></div><div><strong>6+ years pro</strong><span>Basketball on three continents</span></div><div><strong>4+ years</strong><span>Shooting Houston real estate</span></div></div></div></section>` +
    `<section class="section on-dark"><div class="wrap split"><div><span class="eyebrow rv">Before the camera</span><h2 class="rv d1">Built on the court.</h2></div><div class="prose rv"><p class="lede">I spent more than six years playing professional basketball around the world: Portugal, Finland, Serbia, North Macedonia, Australia and the NBA G League.</p><p style="color:var(--on-dark-muted)">That life teaches you to prepare, show up on time and perform when it counts. I bring the same work ethic and creativity to every shoot. Teamwork makes the dream work, and on every listing, I’m on your team.</p></div></div></section>` +
    `<section class="section"><div class="wrap"><span class="eyebrow rv">Why agents book Marz Media</span><h2 class="rv d1" style="max-width:20ch">I know what your listing needs, because I’m an agent too.</h2><ol class="steps"><li class="rv"><h3>An agent’s eye</h3><p>I know what agents want from their media and what they don’t. Every room is shot with the buyer in mind, so the right information shows up throughout the property.</p></li><li class="rv d1"><h3>Pro-level professionalism</h3><p>On time, prepared and respectful of your seller’s home. The same standard I held as a professional athlete.</p></li><li class="rv d2"><h3>One point of contact</h3><p>I shoot and deliver every job myself, so the quality never changes hands.</p></li><li class="rv d3"><h3>Marketing-minded</h3><p>Off the clock I’m still playing ball and a tech nerd at heart, with several marketing certifications. I care how your listing performs online, not just how it looks.</p></li></ol></div></section>` +
    cta(byKey('45f910f0')) + `</main>` + footer();
}

// AREAS HUB + PAGES
{
  const H = byKey('db167043');
  pages['houston.html'] = head({ file: 'houston.html', title: 'Houston Real Estate Photography: Areas We Serve | Marz Media', desc: 'Luxury real estate photography and video across Houston: River Oaks, Memorial, West U, Bellaire, The Heights, The Woodlands, Katy, Cypress, Sugar Land and Tomball.', image: src(H, 1600) }) +
    header('houston.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Areas we serve', h1: 'All of Houston. Every luxury market.', lede: 'Based in Cypress and shooting across the Greater Houston area, inside the Loop and out.' }) +
    `<section class="section"><div class="wrap"><span class="eyebrow rv">Neighborhoods & cities</span><h2 class="rv d1">Where we shoot.</h2><div class="area-grid">${AREAS.map((a) => `<a class="area-card rv" href="${a.slug}.html"><img src="${src(byKey(a.img), 800)}" alt="" width="800" height="533" loading="lazy"><span>${a.name}</span></a>`).join('')}</div>
<div class="prose rv" style="margin-top:56px"><p>We also photograph homes in ${OTHER_AREAS.join(', ')} and across Harris, Fort Bend and Montgomery counties. Not sure if we cover your listing? Call or text <a href="tel:${TEL}">${PHONE}</a>.</p></div></div></section>` +
    cta(byKey('3ee3861a')) + `</main>` + footer();
  AREAS.forEach((a, n) => {
    const r = byKey(a.img), picks = rows.filter((x) => x !== r).filter((_, i) => (i + n * 5) % 7 === 0).slice(0, 6);
    const others = AREAS.filter((x) => x !== a);
    pages[a.slug + '.html'] = head({ file: a.slug + '.html', title: `${a.name} Real Estate Photography & Video | Marz Media Houston`, desc: `Luxury real estate photography, cinematic video, drone and 3D tours in ${a.name}. Photos next business day. Book online with live availability.`, image: src(r, 1600),
      extra: ld({ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Real estate photography and videography', name: `${a.name} real estate photography`, provider: { '@id': ORIGIN + '/#business' }, areaServed: { '@type': 'Place', name: a.name + ', TX' }, url: `${ORIGIN}/${a.slug}.html` }) +
        ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Areas', item: ORIGIN + '/houston.html' }, { '@type': 'ListItem', position: 3, name: a.name, item: `${ORIGIN}/${a.slug}.html` }] }) }) +
      header('houston.html') + `<main id="main">` +
      hero(r, { short: true, crumbs: '<p class="crumbs"><a href="houston.html">Areas</a> / ' + a.name + '</p>', eyebrow: 'Real estate photography & video', h1: `${a.name} real estate photography.`, lede: a.focus, actions: BTN_BOOK }) +
      `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">${a.name}, Texas</span><h2 class="rv d1">Luxury listing media for ${a.name}.</h2></div><div class="prose rv"><p class="lede">${a.blurb}</p><p>Marz Media covers ${a.name} with HDR photography, cinematic video and reels, FAA-certified drone work, 3D virtual tours, twilight photography and floor plans. Photos arrive the next business day and video within 24–72 hours, so your listing goes live on schedule.</p><p><a class="link" href="services.html">See pricing</a></p></div></div></section>` +
      `<section class="section paper"><div class="wrap"><span class="eyebrow rv">Recent work around Houston</span><div class="mosaic" data-lb style="margin-top:28px">${picks.map((x, i) => fig(x, i + n)).join('')}</div></div></section>` +
      `<section class="section tight"><div class="wrap"><span class="eyebrow rv">Packages</span>${tiers()}<p style="margin-top:36px;color:var(--muted)">Also serving ${others.map((o) => `<a class="link" href="${o.slug}.html">${o.name}</a>`).join(', ')}.</p></div></section>` +
      cta(byKey(AREAS[(n + 3) % AREAS.length].img), `Booking in ${a.name}?`) + `</main>` + footer();
  });
}

// PRIVACY + ACCESSIBILITY
{
  const H = byKey('3ee3861a');
  const page = (file, title, desc, h1, body) => {
    pages[file] = head({ file, title, desc, image: src(H, 1600) }) + header('') + `<main id="main">` +
      hero(H, { short: true, eyebrow: 'Marz Media Photography', h1 }) +
      `<section class="section"><div class="wrap"><div class="prose">${body}</div></div></section></main>` + footer();
  };
  page('privacy.html', 'Privacy Policy | Marz Media Photography', 'How Marz Media Photography collects, uses and protects the information you share when you book.', 'Privacy policy.',
    `<p><em>Last updated October 2026</em></p>
<p>Marz Media Photography (“Marz Media,” “we,” “us”) is a real estate photography and video business based in Cypress, Texas. This policy explains what information we collect through this website and how we use it.</p>
<h2>What we collect</h2><ul><li><strong>Booking details you provide:</strong> your name, email, phone number, brokerage or business name, the property or shoot address, square footage, access instructions and any notes.</li><li><strong>Basic site usage:</strong> standard technical information such as browser type and pages visited, collected by our hosting and booking providers to keep the site secure and working.</li></ul>
<h2>How we use it</h2><ul><li>To schedule, confirm and deliver your shoot, and to contact you about it.</li><li>To send your invoice and keep business records.</li><li>To respond to questions you send us.</li></ul><p>We do not sell your information, and we do not use it for third-party advertising.</p>
<h2>Who helps us</h2><p>We use trusted service providers to run the business: Wix (online booking and scheduling), Google (calendar and address suggestions), Stripe (invoices and payments) and Netlify (website hosting). They process your information only to provide their services to us. Card payments are handled by Stripe; we never see or store your full card number.</p>
<h2>How long we keep it</h2><p>We keep booking and invoice records for as long as needed to serve you and to meet tax and accounting requirements.</p>
<h2>Your choices</h2><p>You can ask us to access, correct or delete your information at any time by emailing <a href="mailto:${EMAIL}">${EMAIL}</a>. We will respond within a reasonable time.</p>
<h2>Contact</h2><p>Marz Media Photography · Cypress, Texas · <a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${TEL}">${PHONE}</a></p>`);
  page('accessibility.html', 'Accessibility Statement | Marz Media Photography', 'Our commitment to making the Marz Media Photography website usable for everyone.', 'Accessibility.',
    `<p>Marz Media Photography wants everyone to be able to browse our work and book a shoot. This website is built with accessibility in mind, including descriptive text on images, keyboard-friendly navigation, readable color contrast and layouts that work on phones, tablets and computers.</p>
<p>If anything on the site is hard to use, or you would prefer to book by phone, call or text <a href="tel:${TEL}">${PHONE}</a> or email <a href="mailto:${EMAIL}">${EMAIL}</a> and we will take care of you directly.</p>`);
}

// 404
pages['404.html'] = head({ file: '404.html', title: 'Page not found | Marz Media', desc: 'This page could not be found.', image: src(byKey('3ee3861a'), 1600) }).replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="x-canonical"') +
  header('') + `<main id="main">` + hero(byKey('3ee3861a'), { eyebrow: '404', h1: 'This room is off the floor plan.', lede: 'The page you were looking for has moved or no longer exists.', actions: '<a class="btn btn-light" href="index.html">Back home</a>' + BTN_PORT }) + `</main>` + footer();


const out = [];
for (const [f, html] of Object.entries(pages)) out.push({ path: f, content: html.replace(/\n\s*/g, '\n') });
const urls = Object.keys(pages).filter((f) => f !== '404.html');
out.push({ path: 'sitemap.xml', content: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((f) => `<url><loc>${ORIGIN}/${f === 'index.html' ? '' : f}</loc>${f === 'portfolio.html' ? rows.map((r) => `<image:image><image:loc>${src(r, 1600).replace(/&/g, '&amp;')}</image:loc></image:image>`).join('') : ''}</url>`).join('\n')}\n</urlset>\n` });
out.push({ path: 'robots.txt', content: LIVE ? `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n' });
if (typeof wix === 'undefined' || wix.dryRun) return out;
const missing = ['3ee3861a', '1224ba40', '4f28507a', 'ca539374', '790b5577', 'db167043', '8b28c979', '45f910f0', 'a6eeb3e9', '6e038479'].filter((k) => !byKey(k));
if (rows.length !== 74 || missing.length) return { error: 'catalog parse', rows: rows.length, missing };
const mp = wix.multipart(out);
const drop = await wix.request({
  scope: 'account',
  method: 'POST',
  url: `https://www.wixapis.com/headless-business-setup/v1/headless-business/${SITE_ID}/drop?campaign=mcp&agent=claude-code`,
  headers: { 'Content-Type': mp.contentType },
  body: mp.body,
});
return { files: out.map((o) => o.path + ' ' + o.content.length), drop: drop.data };
}