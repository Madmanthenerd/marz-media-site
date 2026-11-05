// Builds the Marz Media static site into site/dist from catalog.tsv + the page content below.
// Usage: node site/build.mjs <assetCommit> [--live] [--local]
//   assetCommit: the git commit whose site/assets + pricing.js jsDelivr serves.
//   --live drops the preview noindex (use only once the site is on marzmediaphotography.com).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv[2];
if (!COMMIT) { console.error('usage: node site/build.mjs <commit> [--live]'); process.exit(1); }
const LIVE = process.argv.includes('--live');
// --local serves the assets from the site itself (Netlify hosting) instead of jsDelivr.
const LOCAL = process.argv.includes('--local');
// Cache-busting version for CSS/JS (browsers cache /site/* for an hour).
const VER = String(COMMIT || Date.now()).slice(0, 7);
const CDN = LOCAL ? '' : `https://cdn.jsdelivr.net/gh/Madmanthenerd/marz-media-site@${COMMIT}`;
const ORIGIN = 'https://www.marzmediaphotography.com';
const OUT = path.join(here, 'dist');
const PHONE = '346-533-4026', TEL = '+13465334026', EMAIL = 'admin@marzmediaphotography.com';
const IG = 'https://www.instagram.com/marzmediaphotography/';
const GA = 'G-4BVLLTL8N6'; // Google Analytics 4 (Marz Media Website stream)
// Flip to true once property websites are live; turns on the FAQ answer and site mentions.
const PROPERTY_SITES = false;
// Interiors and Commercial live as sections of Services (and in the portfolio) for now.
// Flip to true to bring back their own pages (/interiors, /commercial) and header links.
const SPECIALTY_PAGES = false;

/* ---------- media ---------- */
const rows = fs.readFileSync(path.join(here, 'catalog.tsv'), 'utf8').trim().split('\n').slice(1).map((l) => {
  const [id, w, h, album, subject] = l.split('\t');
  return { id, w: +w, h: +h, album, subject };
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
const albumOf = (r) => r.album === 'twilight' ? 'twilight exteriors' : r.album === 'aerial' ? 'aerials exteriors' : r.album === 'commercial' ? 'commercial' : r.album === 'interior' ? (isKitchen(r) ? 'interiors kitchens' : 'interiors') : r.album === 'exterior' ? 'exteriors' : 'design';
const fig = (r, i, W = 900) => `<figure data-album="${albumOf(r)}" tabindex="0">${img(r, W, i)}<figcaption>${cap(r.subject)}</figcaption></figure>`;

const REELS = [
  ['338ed0e12280445b8c8a47f5f46fbcbb', 'Kitchen and living reel'],
  ['3bda098489c14c6082cf5e0362e947a9', 'Modern kitchen listing reel'],
  ['74492e17923b4db9b15b388ec5274180', 'Land and lots drone reel'],
  ['2ccdf7eae9c84accbd515aa7ac7e80c2', 'Kitchen walkthrough reel'],
  ['a6c50bcebb614ad0ae126be7e2daa655', 'Closing day reel'],
  ['a10e2a5ca7b946f5a303301db6613d49', 'Agent team brand reel'],
  ['273050ae587c4e03afe9cb800399074e', 'Primary suite listing reel'],
  ['3875bd1d477c4495bbedfe19412c9e87', 'Dining room walkthrough reel'],
  ['e01b49b060d4453bb363e8cab27ade3c', 'New construction detail reel'],
  ['0ee49625e1f84f8ab0af6d42079d39e4', 'Demolition and rebuild reel'],
  ['7688ad7e108c458081c62f7db7879fe0', 'Neighborhood intro reel'],
  ['9dafc5d820f948739d73a6c92f39d50d', 'Agent brand reel'],
  ['2cb77cb712ad48999a92bcbab6f322e0', 'Listing walkthrough reel'],
  ['1fb453ade43846068c5334275e3b2b65', 'Bedroom walkthrough reel'],
  ['dac54bfd72184e3baaf23295b3b0aae8', 'Cozy bedroom detail reel'],
  ['0146be95f8fa44338a0eb0296ec1296e', 'Living room walkthrough reel'],
  ['6928c6ed643547388067c17de9b54eb0', 'Open living room reel'],
  ['a52f04458c564d048afe5d7d7f01d0f9', 'Bath and finishes reel'],
  ['b04443b3c671431cac7c3fefdd277178', 'Hallway walkthrough reel'],
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
const NAV = [['portfolio.html', 'Portfolio'], ['services.html', 'Services & pricing'], ...(SPECIALTY_PAGES ? [['interiors.html', 'Interiors'], ['commercial.html', 'Commercial']] : []), ['about.html', 'About']];
const PERSON = {
  '@type': 'Person', '@id': ORIGIN + '/about#alex', name: 'Alex Marzette', alternateName: 'Alexander Marzette', url: ORIGIN + '/about',
  jobTitle: 'Founder & Photographer', worksFor: { '@id': ORIGIN + '/#business' }, sameAs: [IG],
  image: 'https://static.wixstatic.com/media/3f0f07_62cd129eba1942e593f8cdb9dba24316~mv2.jpg/v1/fill/w_1000,h_1500,al_c,q_82,enc_auto/alex-marzette-houston-real-estate-photographer.jpg',
  hasCredential: [
    { '@type': 'EducationalOccupationalCredential', name: 'FAA Part 107 Remote Pilot Certificate', credentialCategory: 'license', recognizedBy: { '@type': 'GovernmentOrganization', name: 'Federal Aviation Administration', url: 'https://www.faa.gov' } },
    { '@type': 'EducationalOccupationalCredential', name: 'Texas Real Estate Sales Agent License', credentialCategory: 'license', recognizedBy: { '@type': 'GovernmentOrganization', name: 'Texas Real Estate Commission', url: 'https://www.trec.texas.gov' } },
  ],
  knowsAbout: ['Real estate photography', 'Real estate videography', 'Interior design photography', 'Commercial real estate photography', 'Drone photography', 'Real estate marketing'],
};
// Visible author box: who shot it and why he's qualified (E-E-A-T)
const byline = (topic = 'every shoot') => `<section class="section tight"><div class="wrap"><div class="byline rv"><img src="${PERSON.image.replace('w_1000,h_1500', 'w_200,h_200')}" alt="Alex Marzette" width="96" height="96" loading="lazy"><div><span class="eyebrow">Who shoots ${topic}</span><p><strong>Alex Marzette</strong>, founder of Marz Media Photography. Licensed Texas real estate agent, FAA-certified drone pilot and 4+ years photographing Houston properties. Alex plans, shoots and edits every project himself. <a class="link" href="about.html">More about Alex →</a></p></div></div></div></section>`;
// FAQ block + FAQPage schema (answer-engine friendly: direct question, direct answer)
const faqBlock = (items) => `<section class="section paper"><div class="wrap split"><div><span class="eyebrow rv">FAQ</span><h2 class="rv d1">Questions, answered.</h2></div><div class="faq rv">${items.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>`;
const faqLd = (items) => ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });
const BIZ = {
  '@context': 'https://schema.org', '@type': ['ProfessionalService', 'LocalBusiness', 'Organization'], '@id': ORIGIN + '/#business',
  name: 'Marz Media Photography', url: ORIGIN + '/', telephone: TEL, email: EMAIL,
  image: src(byKey('3ee3861a'), 1600), logo: { '@type': 'ImageObject', url: ORIGIN + '/site/assets/logo.png', width: 600, height: 600 }, priceRange: '$$',
  contactPoint: { '@type': 'ContactPoint', telephone: TEL, email: EMAIL, contactType: 'customer service', areaServed: 'US-TX', availableLanguage: 'English' },
  description: 'Luxury real estate photography, cinematic video, drone and 3D tours across Greater Houston.',
  address: { '@type': 'PostalAddress', addressLocality: 'Cypress', addressRegion: 'TX', addressCountry: 'US' },
  founder: PERSON, employee: { '@id': PERSON['@id'] }, sameAs: [IG],
  areaServed: ['Houston', ...AREAS.map((a) => a.name), ...OTHER_AREAS].map((n) => ({ '@type': 'Place', name: n + ', TX' })),
  knowsAbout: ['Real estate photography', 'Real estate videography', 'Luxury property photography', 'Interior design photography', 'Drone photography', '3D virtual tours', 'Twilight photography'],
};
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

function head({ file, title, desc, image, extra = '' }) {
  const url = ORIGIN + '/' + (file === 'index.html' ? '' : file.replace(/\.html$/, ''));
  return `<!doctype html><html lang="en" class="no-js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${LIVE ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA}');</script>` : ''}
<title>${title}</title><meta name="description" content="${desc}">${LIVE ? '' : '<meta name="robots" content="noindex,nofollow">'}
<link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="Marz Media Photography"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#07090E">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2307090E'/%3E%3Ctext x='32' y='44' font-family='Georgia,serif' font-size='34' fill='%23fff' text-anchor='middle'%3EM%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://static.wixstatic.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Manrope:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${CDN}/site/assets/styles.css?v=${VER}">${ld(BIZ)}${extra}</head>`;
}
function header(file, light) {
  return `<body><a class="skip" href="#main">Skip to content</a><header class="site-head${light ? ' light' : ''}"><div class="wrap bar"><a class="brand" href="index.html" aria-label="Marz Media Photography home">Marz<span>Media</span></a>
<button class="menu-btn" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button><nav class="nav" aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}"${h === file ? ' aria-current="page"' : ''}>${t}</a>`).join('')}<a class="btn btn-primary" href="book.html">Book a shoot</a></nav></div></header>`;
}
const footer = (scripts = '') => `<footer class="site-foot"><div class="wrap top"><div><p class="big">Real estate media for Houston’s finest homes.</p><p>Photography, cinematic video, drone and 3D tours. Shot by Alex Marzette, FAA-certified drone pilot and licensed Texas real estate agent.</p><p><a class="btn btn-light" href="book.html">Book a shoot <span class="arr">→</span></a></p></div>
<div><h4>Services</h4><ul><li><a href="services.html#packages">Listing packages</a></li><li><a href="services.html#a-la-carte">HDR photography</a></li><li><a href="services.html#a-la-carte">Cinematic video</a></li><li><a href="services.html#a-la-carte">Drone & aerial</a></li><li><a href="services.html#a-la-carte">3D virtual tours</a></li><li><a href="services.html#content">Social media reels</a></li><li><a href="services.html#content">Monthly content plans</a></li><li><a href="${SPECIALTY_PAGES ? 'interiors.html' : 'services.html#interiors'}">Interior design photography</a></li><li><a href="${SPECIALTY_PAGES ? 'commercial.html' : 'services.html#commercial'}">Commercial real estate</a></li></ul></div>
<div><h4>Areas</h4><ul>${AREAS.slice(0, 6).map((a) => `<li><a href="${a.slug}.html">${a.name}</a></li>`).join('')}<li><a href="houston.html">All of Houston</a></li></ul></div>
<div><h4>Contact</h4><ul><li><a href="tel:${TEL}">${PHONE}</a></li><li><a href="mailto:${EMAIL}">${EMAIL}</a></li><li><a href="${IG}" rel="noopener">Instagram</a></li><li>Based in Cypress, TX</li><li><a href="prep.html">Prepare your home</a></li><li><a href="faq.html">FAQ</a></li></ul></div></div>
<div class="wrap base"><span>© <span id="year">2026</span> Marz Media Photography · Houston, Texas · <a href="privacy.html">Privacy</a> · <a href="accessibility.html">Accessibility</a></span><span>Luxury real estate photography & video</span></div></footer>
<script src="${CDN}/site/assets/site.js?v=${VER}" defer></script>${scripts}</body></html>`;

function hero(r, { eyebrow, h1, lede, actions = '', facts = '', short = false, crumbs = '' }) {
  return `<section class="hero${short ? ' short' : ''}"><div class="bg"><img src="${src(r, 2400)}" alt="${alt(r, 0)}" width="2400" height="${Math.round(2400 * r.h / r.w)}" fetchpriority="high"></div><div class="wrap">${crumbs}${eyebrow ? `<span class="eyebrow" style="color:rgba(238,241,246,.8)">${eyebrow}</span>` : ''}<h1>${h1}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}${facts}</div></section>`;
}
const BTN_BOOK = '<a class="btn btn-light" href="book.html">Book a shoot <span class="arr">→</span></a>';
const BTN_PORT = '<a class="btn btn-ghost" href="portfolio.html">View portfolio</a>';
const cta = (r, h2 = 'Your next listing deserves to look like this.', lede = 'Live availability and simple pricing by square footage.') =>
  `<section class="cta-band"><img src="${src(r, 2000)}" alt="" width="2000" height="${Math.round(2000 * r.h / r.w)}" loading="lazy"><div class="wrap"><h2 class="rv">${h2}</h2><p class="lede rv d1">${lede}</p><div class="rv d2">${BTN_BOOK}</div></div></section>`;
const ticker = () => { const items = [...AREAS.map((a) => `<a href="${a.slug}.html">${a.name}</a>`), ...OTHER_AREAS.slice(0, 6).map((n) => `<a href="houston.html">${n}</a>`)].join(''); return `<div class="ticker" aria-label="Areas served"><div class="track">${items}${items.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ')}</div></div>`; };

const P = await import(path.join(here, '..', 'pricing.js')).then((m) => m.default || m);
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
  ['Interior Design Photography', 'Styled, true-color portfolio images for designers, builders and stagers.', 'from $375', SPECIALTY_PAGES ? 'interiors.html' : 'services.html#interiors'],
  ['Commercial Real Estate', 'Office, retail, industrial and multifamily, with drone aerials in every package.', 'from $450', SPECIALTY_PAGES ? 'commercial.html' : 'services.html#commercial'],
];

// HOME
{
  // Home hero: twilight pool shot (previous hero: '3ee3861a', the daytime exterior)
  const H = byKey('e97ae12a'), feat = ['4f28507a', 'a814aadb', 'a4abd4f7', '11a5dea3', '3ba4e1ea', '4cbca1ea', 'cc71b813', '3eedf93f', 'a7c39049'].map(byKey);
  pages['index.html'] = head({ file: 'index.html', title: 'Houston Real Estate Photography & Video | Marz Media', desc: 'Luxury real estate photography, cinematic video, drone and 3D tours across Houston, from River Oaks to The Woodlands. Photos next business day.', image: src(H, 1600) }) +
    header('index.html') + `<main id="main">` +
    hero(H, { eyebrow: 'Houston real estate media', h1: 'Luxury listings, captured beautifully.', lede: 'Photography, cinematic video, drone and 3D tours for agents, builders and designers across Greater Houston. Shot by Alex Marzette, start to finish.', actions: BTN_BOOK + BTN_PORT, facts: '<ul class="facts"><li>Photos next business day</li><li>Video in 24–72 hours</li><li>FAA-certified drone pilot</li><li>All of Greater Houston</li></ul>' }) +
    `<section class="section"><div class="wrap split wide-left"><div><span class="eyebrow rv">Marz Media Photography</span><h2 class="rv d1">Media that sells the home before the first showing.</h2><p class="lede rv d2">Buyers decide in the first few photos. Every shoot is planned around light, composition and the story of the home, then delivered fast so your listing goes live on time.</p><p class="rv d2"><a class="link" href="about.html">Meet Alex</a></p></div><div class="figure wide rv d1">${img(byKey('1224ba40'), 1200, 1)}</div></div>
<div class="wrap"><div class="creds rv"><div><strong>Licensed agent</strong><span>A Texas real estate agent behind the camera, who knows what moves a listing.</span></div><div><strong>FAA-certified & insured</strong><span>Licensed, fully insured drone work for aerial photo and video.</span></div><div><strong>Next-day photos</strong><span>Edited photos the next business day; video in 24–72 hours.</span></div><div><strong>One point of contact</strong><span>Alex shoots every job himself, so quality never changes hands.</span></div></div></div></section>` +
    `<section class="section paper"><div class="wrap"><span class="eyebrow rv">Services</span><h2 class="rv d1" style="max-width:16ch">Everything a premium listing needs.</h2><div class="svc" style="margin-top:48px">${SERVICES_LIST.map(([t, d, p, h = 'services.html']) => `<a class="rv" href="${h}"><h3>${t}</h3><span class="from">${p}</span><p>${d}</p></a>`).join('')}</div></div></section>` +
    `<section class="section"><div class="wrap"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:20px;margin-bottom:40px"><div><span class="eyebrow rv">Portfolio</span><h2 class="rv d1">Recent work.</h2></div><a class="link rv" href="portfolio.html">See the full portfolio →</a></div><div class="mosaic" data-lb>${feat.map((r, i) => fig(r, i)).join('')}</div></div></section>` +
    `<section class="section on-dark"><div class="wrap"><span class="eyebrow rv">Video & reels</span><h2 class="rv d1" style="max-width:18ch">Cinematic video, made for the feed.</h2><p class="lede rv d2">Vertical reels and listing films that put your property in front of buyers where they scroll. Hover or tap to play.</p><div class="reels rv" style="margin-top:40px">${REELS.slice(0, 6).map(reel).join('')}</div><p style="margin-top:24px"><a class="link" href="portfolio.html#reels">All reels →</a></p></div></section>` +
    `<section class="section"><div class="wrap"><span class="eyebrow rv">How it works</span><h2 class="rv d1">Simple from start to finish.</h2><ol class="steps"><li class="rv"><h3>Book online</h3><p>Enter the square footage, choose a package and pick a live time slot.</p></li><li class="rv d1"><h3>Prep the home</h3><p>Use the <a class="link" href="prep.html">prep checklist</a>. Lights on, counters clear.</p></li><li class="rv d2"><h3>Shoot day</h3><p>Alex arrives on time, works efficiently and leaves the home as he found it.</p></li><li class="rv d3"><h3>Delivery</h3><p>Photos next business day, video in 24–72 hours.</p></li></ol></div></section>` +
    `<section class="section tight paper"><div class="wrap"><span class="eyebrow rv">Pricing</span><h2 class="rv d1">Simple pricing, by square footage.</h2>${tiers()}<p style="margin-top:28px"><a class="link" href="services.html">See à la carte pricing and add-ons →</a></p></div></section>` +
    `<section class="section tight"><div class="wrap"><span class="eyebrow rv">Serving all of Greater Houston</span></div>${ticker()}</section>` +
    cta(byKey('c4e2cfe7')) + `</main>` + footer();
}

// PORTFOLIO
{
  const albums = [['twilight', 'Twilight'], ['aerials', 'Drone & aerial'], ['interiors', 'Interiors'], ['kitchens', 'Kitchens'], ['exteriors', 'Exteriors & outdoor living'], ['design', 'Interior design'], ['commercial', 'Commercial'], ['reels', 'Reels']];
  const count = (k) => k === 'reels' ? REELS.length : rows.filter((r) => albumOf(r).split(' ').includes(k)).length;
  const order = [...rows].sort((a, b) => ['exterior', 'interior', 'design'].indexOf(a.album) - ['exterior', 'interior', 'design'].indexOf(b.album));
  // interleave so the grid mixes rooms and exteriors
  const isOut = (r) => r.album === 'exterior' || r.album === 'twilight' || r.album === 'aerial';
  const ex = order.filter(isOut), inn = order.filter((r) => !isOut(r)), mixed = [];
  while (ex.length || inn.length) { if (inn.length) mixed.push(inn.shift()); if (inn.length) mixed.push(inn.shift()); if (ex.length) mixed.push(ex.shift()); }
  const H = byKey('1224ba40');
  pages['portfolio.html'] = head({ file: 'portfolio.html', title: 'Portfolio: Houston Real Estate Photography | Marz Media', desc: 'Browse luxury real estate photography, interior design photography, exteriors, kitchens and cinematic reels shot across Houston by Marz Media.', image: src(H, 1600),
    extra: ld({ '@context': 'https://schema.org', '@type': 'ImageGallery', name: 'Marz Media Photography portfolio', url: ORIGIN + '/portfolio.html', creator: { '@id': ORIGIN + '/#business' }, image: rows.slice(0, 40).map((r, i) => ({ '@type': 'ImageObject', contentUrl: src(r, 1600), name: cap(r.subject), description: alt(r, i), creator: { '@type': 'Person', name: 'Alex Marzette' }, copyrightHolder: { '@id': ORIGIN + '/#business' } })) }) }) +
    header('portfolio.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Portfolio', h1: 'Homes, told beautifully.', lede: 'Luxury real estate photography, interior design work and cinematic reels from across Greater Houston.' }) +
    `<section class="section tight"><div class="wrap"><div class="filters" data-filters="#gallery" role="group" aria-label="Filter the portfolio"><button data-filter="all" aria-pressed="true">All<span class="n">${rows.length + REELS.length}</span></button>${albums.map(([k, t]) => `<button data-filter="${k}" aria-pressed="false">${t}<span class="n">${count(k)}</span></button>`).join('')}</div>
<div id="gallery"><div id="reels-block" style="margin-bottom:48px"><h2 style="font-size:28px;margin-bottom:20px">Reels</h2><div class="reels">${REELS.map(reel).join('')}</div></div><div id="photo-block"><div class="mosaic" data-lb>${mixed.map((r, i) => fig(r, i)).join('')}</div></div></div></div></section>` +
    cta(byKey('3ee3861a'), 'Like what you see?', 'Book your listing online with live availability.') + `</main>` + footer();
}

// SERVICES
{
  const H = byKey('86f154c6'); // twilight covered dining (was the daytime kitchen '4f28507a')
  const FAQ = [
    ['How fast will I get my photos?', 'Edited photos are delivered the next business day. Video is delivered within 24–72 hours. Same-day delivery is available for $75 when the shoot starts between 8 and 9 AM.'],
    ['How is pricing set?', 'By the home’s heated square footage as listed on HAR or MLS: up to 2,499, 2,500–3,999 and 4,000–5,999 sq ft. Homes of 6,000–7,499 sq ft: HDR photos are $325 and other services are quoted. Homes of 7,500 sq ft and up are custom quoted.'],
    ['Do you fly drones legally?', 'Yes. Alex is an FAA-certified drone pilot, fully insured, and checks airspace and any HOA restrictions before every aerial shoot. A certificate of insurance is available on request.'],
    ['When are twilight photos taken?', 'Around sunset on the day of your shoot. Alex confirms the timing with you after booking.'],
    ['What areas do you serve?', 'All of Greater Houston, including River Oaks, Memorial, West University Place, Bellaire, The Heights, The Woodlands, Katy, Cypress, Sugar Land and Tomball.'],
    ['Do you shoot reels for businesses, not just listings?', 'Yes. Social media reels start at $165 for agents, businesses, restaurants and events, with drone footage for +$35. Monthly content plans start at $599 for 4 reels a month with drone included.'],
    ['How should I prepare the home?', 'Turn on every light, open blinds, clear counters and move cars from the driveway. The full room-by-room checklist is on the prep guide.'],
  ];
  const row = (k) => { const it = P.ITEMS[k]; return `<tr><td>${it.name}</td>${[0, 1, 2, 3].map((i) => `<td>${it.prices[i] == null ? 'Quote' : money(it.prices[i])}</td>`).join('')}<td>Quote</td></tr>`; };
  pages['services.html'] = head({ file: 'services.html', title: 'Real Estate Photography Pricing in Houston | Marz Media', desc: 'Listing packages from $349, HDR photography, cinematic video, drone, 3D tours, twilight and floor plans. Simple square-footage pricing across Houston.', image: src(H, 1600),
    extra: ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }) +
      ld({ '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'Real estate media packages', itemListElement: P.PACKAGES.map((p) => ({ '@type': 'Offer', name: p.name + ' listing package', price: p.price, priceCurrency: 'USD', description: p.includes.join(', ') + '. ' + PKG_DESC[p.id] + '.', seller: { '@id': ORIGIN + '/#business' } })) }) }) +
    header('services.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Services & pricing', h1: 'Simple pricing. Premium results.', lede: 'Every price is set by square footage and shown up front.', actions: BTN_BOOK + (SPECIALTY_PAGES ? '' : '<a class="btn btn-ghost" href="#interiors">Interiors & commercial</a>') }) +
    `<section class="section" id="packages"><div class="wrap"><span class="eyebrow rv">Listing packages</span><h2 class="rv d1">Photo, video and twilight in one visit.</h2><p class="lede rv d2">Add drone coverage to any package from $35, plus 3D tours, floor plans, virtual staging or same-day delivery.</p>${tiers()}</div></section>` +
    `<section class="section paper" id="a-la-carte"><div class="wrap"><span class="eyebrow rv">À la carte</span><h2 class="rv d1">Build exactly what you need.</h2><div class="rate-wrap rv"><table class="rate"><thead><tr><th>Service</th><th>Up to 2,499 sq ft</th><th>2,500–3,999</th><th>4,000–5,999</th><th>6,000–7,499</th><th>7,500+</th></tr></thead><tbody>${row('hdr')}${row('video')}${row('tour3d')}<tr><td>Aerial Photography</td><td colspan="5">$115 · add aerial video for +$50</td></tr></tbody></table></div>
<h3 class="rv" style="margin-top:56px">Add-ons</h3><div class="addons rv"><div><strong>Drone coverage <span>$35–$50</span></strong><span>Added to any package or shoot: $35 under 2,500 sq ft, $50 above. Drone-only orders are $115</span></div><div><strong>Twilight photography <span>$75</span></strong><span>Captured at sunset</span></div><div><strong>Floor plans <span>$50</span></strong><span>Clean, accurate layouts</span></div><div><strong>Virtual staging <span>$15/photo</span></strong><span>Empty rooms furnished digitally. We recommend 3: living room, kitchen and primary bedroom</span></div><div><strong>Same-day delivery <span>$75</span></strong><span>Photos the same evening, for 8–9 AM shoots</span></div></div></div></section>` +
    `<section class="section on-dark" id="content"><div class="wrap"><span class="eyebrow rv">Social media reels</span><h2 class="rv d1" style="max-width:20ch">Reels for your brand, not just your listings.</h2><p class="lede rv d2">Vertical content for agents, businesses, restaurants and events, shot and edited for Instagram, TikTok and YouTube Shorts. No listing needed.</p><div class="tiers rv" style="margin-top:40px">${P.CONTENT.plans.filter((p) => !p.monthly).map((p) => `<article class="tier" style="background:transparent;color:var(--on-dark);border-color:rgba(255,255,255,.2)"><span class="badge" style="color:#9DB4E0">${p.reels === 1 ? 'Start here' : 'Best value per shoot'}</span><h3>${p.name}</h3><div class="price">${money(p.price)}</div><span class="size">${p.desc}</span><ul><li>Up to 1 hour on location</li><li>Music, captions-ready, edited in-house</li><li>Delivered within 3 business days</li><li>Drone footage +${money(P.CONTENT.drone.price)}</li></ul><a class="btn btn-light" href="book.html?type=content&amp;plan=${p.id}">Book ${p.name}</a></article>`).join('')}<article class="tier" style="background:transparent;color:var(--on-dark);border-color:rgba(255,255,255,.2)"><span class="badge" style="color:#9DB4E0">Every month</span><h3>Monthly content</h3><div class="price">${money(P.CONTENT.plans.find((p) => p.monthly).price)}<small style="font-size:18px">/mo</small></div><span class="size">From 4 reels a month, drone included</span><ul>${P.CONTENT.plans.filter((p) => p.monthly).map((p) => `<li>${p.reels} reels / month · ${money(p.price)}</li>`).join('')}<li>${P.CONTENT.minMonths}-month minimum</li></ul><a class="btn btn-light" href="book.html?type=content&amp;plan=monthly6">Start a plan</a></article></div></div></section>` +
    `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">Good to know</span><h2 class="rv d1">Booking policies.</h2></div><div class="prose rv"><ul><li><strong>Arrival times</strong> are in Houston time. Packages take about two hours on site; photo-only shoots about an hour.</li><li><strong>Homes of 6,000–7,499 sq ft:</strong> HDR photos are $325; video, 3D tours and packages are custom quoted. Homes of 7,500+ sq ft are custom quoted. You can still reserve your time online.</li><li><strong>Cancellations.</strong> Cancelling on the day of the shoot is ${money(P.POLICY.cancelSameDay)}. If Alex has already arrived at the property, the fee is ${money(P.POLICY.cancelOnSite)}.</li><li><strong>Weather.</strong> Drone and twilight work depend on conditions; Alex will reschedule those parts with you if needed.</li><li><strong>Prep matters.</strong> Please follow the <a href="prep.html">prep checklist</a> before we arrive.</li></ul></div></div></section>` +
    `<section class="section paper"><div class="wrap split"><div><span class="eyebrow rv">FAQ</span><h2 class="rv d1">Questions, answered.</h2></div><div class="faq rv">${FAQ.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${q}</summary><p>${a.replace('prep guide', '<a class="link" href="prep.html">prep guide</a>')}</p></details>`).join('')}<p style="margin-top:20px"><a class="link" href="faq.html">All questions →</a></p></div></div></section>` +
    byline('your listing') + cta(byKey('66f29cfc')) + `</main>` + footer();
}

// BOOK
// Booking page: the three ways to book, chosen first.
const BOOK_CHOICES = () => [
  ['choicePkg', 'Listing package', 'Photos, cinematic video and twilight in one visit.', `from ${money(P.PACKAGES[0].price)}`, '3ee3861a', 'Best value'],
  ['choiceAla', 'Build your own', 'Only what you need: photos, video, drone, 3D tour.', 'from $115', '790b5577', ''],
  ['choiceReel', 'Social media reels', 'Vertical content for your brand or business.', `from ${money(P.CONTENT.plans[0].price)}`, '1224ba40', ''],
].map(([id, t, d, p, k, tag]) => { const r = byKey(k); return `<button type="button" class="choice" role="radio" id="${id}" aria-checked="false"><span class="ph"><img src="${src(r, 720)}" alt="" width="720" height="${Math.round(720 * r.h / r.w)}" loading="lazy"></span><span class="tx">${tag ? `<span class="tag">${tag}</span>` : ''}<strong>${t}</strong><span class="d">${d}</span><span class="pr">${p}</span></span><span class="ck" aria-hidden="true"></span></button>`; }).join('');

pages['book.html'] = head({ file: 'book.html', title: 'Book a Real Estate Photo Shoot in Houston | Marz Media', desc: 'Book Houston real estate photography, video, drone, 3D tours and social media reels online with live availability.', image: src(byKey('3ee3861a'), 1600) }) +
  header('book.html', true) + `<main id="main" style="padding-top:76px"><div id="app" class="wrap"><div style="padding-top:48px"><span class="eyebrow">Book online</span><h1 style="font-size:clamp(40px,6vw,72px)">Book your shoot.</h1><ul class="hero-facts" style="display:flex;flex-wrap:wrap;gap:8px 26px;list-style:none;padding:0;margin:20px 0 0;color:var(--muted);font-size:14px"><li>Live availability</li><li>Photos next business day</li><li>Video in 24–72 hours</li></ul></div>
<form class="bk-grid" id="form" novalidate><div>
<section class="step" aria-labelledby="h0s"><div class="step-h"><span class="step-n">01</span><h2 id="h0s" tabindex="-1">What are you booking?</h2></div><div class="choices" role="radiogroup" aria-labelledby="h0s">${BOOK_CHOICES()}</div></section>
<div id="flow" hidden>
<section class="step" aria-labelledby="h1s"><div class="step-h"><span class="step-n">02</span><h2 id="h1s">The property</h2></div>
<div class="field" id="purposeField" hidden><label for="purpose">What’s it for?</label><select id="purpose">${P.CONTENT.purposes.map((x) => `<option>${x}</option>`).join('')}</select></div>
<div class="field"><label for="address" id="addrLabel">Property address</label><input type="text" id="address" autocomplete="street-address" placeholder="Start typing the address"></div>
<div class="field" id="sqftField"><label for="sqft">Heated square footage</label><input type="number" id="sqft" inputmode="numeric" min="100" step="1" placeholder="e.g. 3200"><div class="ruler" aria-hidden="true"><div class="bands"><div class="band">Essential</div><div class="band">Pro</div><div class="band">Signature</div><div class="band">Estate</div><div class="pin" id="pin" hidden></div></div><div class="ticks"><span>0</span><span>2,500</span><span>4,000</span><span>6,000+</span></div></div><p class="hint" id="tierHint"></p></div></section>
<section class="step"><div class="step-h"><span class="step-n">03</span><h2 id="h2" tabindex="-1">What you need</h2></div><div id="contentNeeds" hidden><p class="subh" style="margin-top:0">Reels</p><div class="pkgs two" id="plansOne" role="radiogroup" aria-label="Reel options"></div><div class="opts" id="contentExtras" style="margin-top:12px"></div><p class="subh">Monthly content plans</p><div class="pkgs" id="plansMonthly" role="radiogroup" aria-label="Monthly plans"></div><p class="hint" id="planNote"></p></div><div id="listNeeds">
<div id="pkgWrap" hidden style="margin-top:0"><div class="pkgs" id="pkgs" role="radiogroup" aria-label="Packages"></div><p class="subh">Add to your package</p><div class="opts" id="pkgExtras"></div></div>
<div id="alaWrap" hidden><p class="subh" style="margin-top:0">Services</p><div class="opts" id="alaServices"></div><p class="subh">Add-ons</p><div class="opts" id="alaAddons"></div></div></div><p class="err" id="svcErr" hidden></p></section>
<section class="step"><div class="step-h"><span class="step-n">04</span><h2 id="h3" tabindex="-1">Date and time</h2></div><div id="dateGate" class="note">Add the square footage and choose your services to see open times.</div>
<div id="dateBox" hidden><div class="cal-tools"><div class="seg sm" role="group" aria-label="Calendar view"><button type="button" id="viewWeek" aria-pressed="true">Next 2 weeks</button><button type="button" id="viewMonth" aria-pressed="false">Month</button></div><label class="jump" for="jumpDate">Go to date <input type="date" id="jumpDate"></label></div><div class="wk" id="wkWrap"><button type="button" class="wk-btn" id="prevWk" aria-label="Earlier dates">‹</button><div class="days" id="days" role="group" aria-label="Choose a day"></div><button type="button" class="wk-btn" id="nextWk" aria-label="Later dates">›</button></div><div id="month" class="cal" hidden></div><div id="slotBox"></div></div><p class="hint" id="twiNote" hidden>Twilight photos are captured around sunset the same day. Alex confirms that timing with you.</p></section>
<section class="step"><div class="step-h"><span class="step-n">05</span><h2>Your details</h2></div><div class="row2">
<div class="field"><label for="fname">First name</label><input type="text" id="fname" autocomplete="given-name"></div><div class="field"><label for="lname">Last name</label><input type="text" id="lname" autocomplete="family-name"></div>
<div class="field"><label for="email">Email</label><input type="email" id="email" autocomplete="email"></div><div class="field"><label for="phone">Mobile</label><input type="tel" id="phone" autocomplete="tel"></div>
<div class="field"><label for="brokerage"><span id="brkLabel">Brokerage</span> <span class="opt-hint">(optional)</span></label><input type="text" id="brokerage" autocomplete="organization"></div><div class="field lst-only"><label for="golive">Listing go-live date <span class="opt-hint">(optional)</span></label><input type="date" id="golive"></div>
<div class="field lst-only"><label for="occupancy">Property status</label><select id="occupancy"><option>Vacant</option><option>Occupied</option></select></div><div class="field lst-only"><label for="access">Access</label><select id="access"><option>Supra lockbox</option><option>Owner present</option><option>Other</option></select></div></div>
<div class="field lst-only"><label for="accessNotes">Access notes <span class="opt-hint">(lockbox, gate code)</span></label><input type="text" id="accessNotes"></div>
<div class="field"><label for="notes">Anything else <span class="opt-hint">(optional)</span></label><textarea id="notes" placeholder="Rooms to feature, HOA rules for drones…"></textarea></div>
<div class="hp" aria-hidden="true"><label for="company">Company</label><input type="text" id="company" tabindex="-1" autocomplete="off"></div></section></div></div>
<aside class="sum" aria-labelledby="sumh"><h3 id="sumh">Your order</h3><p class="meta" id="sumMeta"></p><ul class="lines" id="sumLines"></ul><p class="empty" id="sumEmpty"></p><div class="tot"><span>Total</span><strong id="sumTotal">$0</strong></div>
<button type="submit" class="btn btn-primary cta" id="submit">Confirm booking</button><p class="err" id="formErr" hidden></p>
<p class="ret">Posting every month? <a href="services.html#content">Monthly content plans</a> start at $599 for 4 reels, drone included. Call or text <a href="tel:${TEL}">${PHONE}</a>.</p></aside></form></div>
<section class="done wrap" id="done" hidden aria-live="polite"></section></main>
<div class="mbar" id="bar"><div class="bt"><small id="barSub">Choose your services</small><strong id="barTotal">$0</strong></div><button type="button" class="btn btn-primary" id="barBtn">Continue</button></div>` +
  footer(`<script src="${CDN}/pricing.js?v=${VER}"></script><script type="module" src="${CDN}/site/assets/book.js?v=${VER}"></script>`);

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
  pages['prep.html'] = head({ file: 'prep.html', title: 'How to Prep Your Home for Listing Photos | Marz Media', desc: 'A room-by-room checklist for decluttering and preparing your Houston home before real estate photography, video and drone.', image: src(H, 1600) }) +
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
  pages['about.html'] = head({ file: 'about.html', title: 'About Alex Marzette | Marz Media Photography, Houston', desc: 'Meet Alex Marzette: licensed Texas agent, FAA-certified drone pilot and former pro basketball player behind Marz Media Photography in Cypress, TX.', image: ALEX,
    extra: ld({ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { ...PERSON, description: 'Licensed Texas real estate agent, FAA-certified drone pilot and former professional basketball player. Founder of Marz Media Photography in Cypress, Texas.' } }) }) +
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
  pages['houston.html'] = head({ file: 'houston.html', title: 'Houston Real Estate Photography: Areas We Serve | Marz Media', desc: 'Luxury real estate photography and video across Houston: River Oaks, Memorial, West U, Bellaire, The Heights, The Woodlands, Katy and Cypress.', image: src(H, 1600) }) +
    header('houston.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'Areas we serve', h1: 'All of Houston. Every luxury market.', lede: 'Based in Cypress and shooting across the Greater Houston area, inside the Loop and out.' }) +
    `<section class="section"><div class="wrap"><span class="eyebrow rv">Neighborhoods & cities</span><h2 class="rv d1">Where we shoot.</h2><div class="area-grid">${AREAS.map((a) => `<a class="area-card rv" href="${a.slug}.html"><img src="${src(byKey(a.img), 800)}" alt="" width="800" height="533" loading="lazy"><span>${a.name}</span></a>`).join('')}</div>
<div class="prose rv" style="margin-top:56px"><p>We also photograph homes in ${OTHER_AREAS.join(', ')} and across Harris, Fort Bend and Montgomery counties. Not sure if we cover your listing? Call or text <a href="tel:${TEL}">${PHONE}</a>.</p></div></div></section>` +
    cta(byKey('3ee3861a')) + `</main>` + footer();
  AREAS.forEach((a, n) => {
    const r = byKey(a.img), picks = rows.filter((x) => x !== r).filter((_, i) => (i + n * 5) % 7 === 0).slice(0, 6);
    const others = AREAS.filter((x) => x !== a);
    pages[a.slug + '.html'] = head({ file: a.slug + '.html', title: `${a.name.split(/,| &/)[0]} Real Estate Photography | Marz Media`, desc: `Luxury real estate photography, cinematic video, drone and 3D tours in ${a.name.split(/,| &/)[0]}. Photos next business day. Book online with live availability.`, image: src(r, 1600),
      extra: ld({ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Real estate photography and videography', name: `${a.name} real estate photography`, provider: { '@id': ORIGIN + '/#business' }, areaServed: { '@type': 'Place', name: a.name + ', TX' }, url: `${ORIGIN}/${a.slug}.html` }) +
        ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Areas', item: ORIGIN + '/houston.html' }, { '@type': 'ListItem', position: 3, name: a.name, item: `${ORIGIN}/${a.slug}.html` }] }) }) +
      header('houston.html') + `<main id="main">` +
      hero(r, { short: true, crumbs: '<p class="crumbs"><a href="houston.html">Areas</a> / ' + a.name + '</p>', eyebrow: 'Real estate photography & video', h1: `${a.name} real estate photography.`, lede: a.focus, actions: BTN_BOOK }) +
      `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">${a.name}, Texas</span><h2 class="rv d1">Luxury listing media for ${a.name}.</h2></div><div class="prose rv"><p class="lede">${a.blurb}</p><p>Marz Media covers ${a.name} with HDR photography, cinematic video and reels, FAA-certified drone work, 3D virtual tours, twilight photography and floor plans. Photos arrive the next business day and video within 24–72 hours, so your listing goes live on schedule.</p><p><a class="link" href="services.html">See pricing</a></p></div></div></section>` +
      `<section class="section paper"><div class="wrap"><span class="eyebrow rv">Recent work around Houston</span><div class="mosaic" data-lb style="margin-top:28px">${picks.map((x, i) => fig(x, i + n)).join('')}</div></div></section>` +
      `<section class="section tight"><div class="wrap"><span class="eyebrow rv">Packages</span>${tiers()}<p style="margin-top:36px;color:var(--muted)">Also serving ${others.map((o) => `<a class="link" href="${o.slug}.html">${o.name}</a>`).join(', ')}.</p></div></section>` +
      byline(`your ${a.name.split(/,| &/)[0]} listing`) + cta(byKey(AREAS[(n + 3) % AREAS.length].img), `Booking in ${a.name}?`) + `</main>` + footer();
  });
}

// INTERIORS + COMMERCIAL (quote requests, not online booking)
{
  // Quote form, collected by Netlify Forms (Netlify dashboard > Forms; email notifications set there).
  const quoteForm = (kind, pkgs, extraFields) => { const x = kind === 'Interiors' ? 'iq' : 'cq'; return `<form class="quote rv" name="quote-${kind.toLowerCase()}" method="POST" action="/quote-thanks" data-netlify="true" netlify-honeypot="company">
<input type="hidden" name="form-name" value="quote-${kind.toLowerCase()}"><div class="hp" aria-hidden="true"><label>Company website <input name="company" tabindex="-1" autocomplete="off"></label></div>
<div class="row2"><div class="field"><label for="${x}-name">Name</label><input id="${x}-name" name="name" autocomplete="name" required></div><div class="field"><label for="${x}-biz">Company <span class="opt-hint">(optional)</span></label><input id="${x}-biz" name="business" autocomplete="organization"></div>
<div class="field"><label for="${x}-email">Email</label><input id="${x}-email" type="email" name="email" autocomplete="email" required></div><div class="field"><label for="${x}-phone">Phone</label><input id="${x}-phone" type="tel" name="phone" autocomplete="tel" required></div></div>
<div class="field"><label for="${x}-addr">Property address</label><input id="${x}-addr" name="address" autocomplete="street-address"></div>
<div class="row2"><div class="field"><label for="${x}-pkg">Package</label><select id="${x}-pkg" name="package">${pkgs.map((p) => `<option value="${p.name}">${p.name} · ${money(p.price)}</option>`).join('')}<option value="Not sure">Not sure yet</option></select></div>${extraFields}
<div class="field"><label for="${x}-date">Preferred date <span class="opt-hint">(optional)</span></label><input id="${x}-date" type="date" name="date"></div></div>
<div class="field"><label for="${x}-notes">About the project</label><textarea id="${x}-notes" name="details" placeholder="Rooms or areas to feature, add-ons you’d like, anything we should know"></textarea></div>
<button type="submit" class="btn btn-primary">Request a quote <span class="arr">→</span></button><p class="hint" style="margin-top:14px">Prefer to talk? Call or text <a href="tel:${TEL}">${PHONE}</a>.</p></form>`; };
  const pkgCards = (pkgs, label, anchor = 'quote', sel = 'iq-pkg') => `<div class="tiers">${pkgs.map((p, i) => `<article class="tier${p.mostBooked ? ' feature' : ''} rv d${i + 1}"><span class="badge">${p.mostBooked ? 'Most popular' : label}</span><h3>${p.name}</h3><div class="price">${money(p.price)}</div><span class="size">${p.size}</span><ul>${p.includes.map((x) => `<li>${x}</li>`).join('')}</ul><a class="btn ${p.mostBooked ? '' : 'btn-primary'}" href="#${anchor}" data-pkg="${p.name}" data-sel="${sel}">Request ${p.name}</a></article>`).join('')}</div>`;
  const addonList = (list) => `<div class="addons rv">${list.map(([t, pr, d]) => `<div><strong>${t} <span>${d === 'from' ? 'from ' : ''}${money(pr)}</span></strong><span>${d === 'from' ? 'Priced by size' : cap(d)}</span></div>`).join('')}</div>`;
  const pickPkg = `<script>document.querySelectorAll('[data-pkg]').forEach(function(a){a.addEventListener('click',function(){var s=document.getElementById(a.getAttribute('data-sel'));if(s)s.value=a.getAttribute('data-pkg');});});</script>`;
  const service = (name, type, desc, low, file) => ld({ '@context': 'https://schema.org', '@type': 'Service', name, serviceType: type, description: desc, provider: { '@id': ORIGIN + '/#business' }, areaServed: { '@type': 'City', name: 'Houston, TX' }, url: `${ORIGIN}/${file}`, offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: low } });

  // INTERIORS
  const I = P.INTERIORS, HI = byKey('4cbca1ea');
  const IFAQ = [
    ['How much does interior design photography cost in Houston?', `Marz Media’s interior packages start at ${money(I.packages[0].price)} for one or two rooms (10 edited images), ${money(I.packages[1].price)} for a half day of up to five rooms (20 images) and ${money(I.packages[2].price)} for a full project (40 images). Additional images are ${money(I.addons[0][1])} each.`],
    ['How is interior design photography different from real estate photography?', 'Real estate photos document a home for buyers. Design photography is composed around the design itself: accurate color and materials, straight lines, and detail and vignette shots that show the thinking behind the space, for portfolios, websites and award submissions.'],
    ['Can I use the photos on my website, social media and award entries?', 'Yes. Every package includes use on your website, social media, portfolio and award or publication submissions. Paid advertising and print ads are quoted separately.'],
    ['Can a builder or vendor on the project use the same photos?', `Yes. Each additional company can license the images for ${money(I.addons[3][1])}, which usually costs everyone less than separate shoots.`],
    ['Who styles the space?', 'You or your stylist lead the styling, since it’s your design. Alex walks the space with you first, plans the shot list, and makes small adjustments for the camera as he shoots.'],
    ['How long until I receive the images?', 'Edited interior images are delivered within 3–5 business days.'],
  ];
  const design = rows.filter((r) => r.album === 'design').concat(['a6eeb3e9', '4f28507a', 'e3a86909'].map(byKey)).slice(0, 12);
  if (SPECIALTY_PAGES) pages['interiors.html'] = head({ file: 'interiors.html', title: 'Interior Design Photography in Houston | Marz Media', desc: `Interior design photography for Houston designers, builders, remodelers and stagers. Styled, true-color portfolio images from ${money(I.packages[0].price)}.`, image: src(HI, 1600),
    extra: service('Interior design photography', 'Interior photography', 'Styled interior photography for interior designers, builders, remodelers, home stagers and short-term rental hosts in Houston.', I.packages[0].price, 'interiors') + faqLd(IFAQ) }) +
    header('interiors.html') + `<main id="main">` +
    hero(HI, { short: true, eyebrow: 'Interior design photography', h1: 'Your best work, photographed like it deserves.', lede: 'Styled, true-color images for interior designers, builders, remodelers and stagers across Greater Houston. Made for your portfolio, website and award submissions.', actions: '<a class="btn btn-light" href="#quote">Request a quote <span class="arr">→</span></a>' }) +
    `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">The difference</span><h2 class="rv d1">Not listing photos. Portfolio images.</h2></div><div class="prose rv"><p class="lede">Real estate photos show a buyer the space. Design photography shows your client the thinking behind it.</p><p>Every shoot is composed around your design: straight lines, accurate color and materials, and the details that make the room yours. You get the wide hero shots plus the vignettes and close-ups that carry a portfolio, a project page or an awards entry.</p></div></div>
<div class="wrap"><div class="creds rv"><div><strong>True color</strong><span>Paint, stone, wood and fabric that match what you specified.</span></div><div><strong>Straight lines</strong><span>Clean verticals and balanced compositions in every frame.</span></div><div><strong>Details & vignettes</strong><span>The hardware, styling and textures that tell the story.</span></div><div><strong>Shot with you</strong><span>We walk the space together and plan the list before the first frame.</span></div></div></div></section>` +
    `<section class="section paper" id="packages"><div class="wrap"><span class="eyebrow rv">Introductory rates</span><h2 class="rv d1">Simple packages, by the scope of the project.</h2><p class="lede rv d2">Edited images are delivered in 3–5 business days. Web, social, portfolio and award use are included.</p>${pkgCards(I.packages, 'Interiors')}
<h3 class="rv" style="margin-top:56px">Add-ons</h3>${addonList(I.addons)}</div></section>` +
    `<section class="section"><div class="wrap"><span class="eyebrow rv">Recent interiors</span><h2 class="rv d1">Rooms with a point of view.</h2><div class="mosaic" data-lb style="margin-top:40px">${design.map((r, i) => fig(r, i)).join('')}</div></div></section>` +
    `<section class="section on-dark"><div class="wrap split"><div><span class="eyebrow rv">Who it’s for</span><h2 class="rv d1">Built for the people who build beautiful spaces.</h2></div><div class="prose rv"><ul><li><strong>Interior designers and decorators:</strong> portfolio, website and award-ready project photos.</li><li><strong>Builders and remodelers:</strong> kitchens, baths, additions and model homes.</li><li><strong>Home stagers:</strong> every staged home, captured before it sells.</li><li><strong>Short-term rental hosts:</strong> listing photos that earn the booking.</li><li><strong>Showrooms and brands:</strong> furniture, cabinetry and finishes in real rooms.</li></ul><p style="color:var(--on-dark-muted)"><strong>Sharing a project?</strong> When a builder, stager or vendor also wants the images, each additional company adds a shared license, so everyone pays less than shooting separately.</p></div></div></section>` +
    `<section class="section" id="quote"><div class="wrap split"><div><span class="eyebrow rv">Request a quote</span><h2 class="rv d1">Tell us about the project.</h2><p class="lede rv d2">Alex will follow up to talk through the space, your shot list and timing.</p></div>${quoteForm('Interiors', I.packages, '')}</div></section>` +
    faqBlock(IFAQ) + byline('your project') + `</main>` + footer(pickPkg);

  // COMMERCIAL
  const C = P.COMMERCIAL, HC = byKey('3ee3861a');
  const CFAQ = [
    ['How much does commercial real estate photography cost in Houston?', `Marz Media’s commercial packages are priced by building size: ${money(C.packages[0].price)} up to 5,000 sq ft, ${money(C.packages[1].price)} for 5,000–20,000 sq ft and ${money(C.packages[2].price)} for 20,000–50,000 sq ft. Larger properties, campuses and multiple buildings are custom quoted from ${money(C.customFrom)}.`],
    ['Is drone photography included?', 'Yes. Every commercial package includes drone aerials, from 5 to 15 depending on the package. Drone video is available as an add-on.'],
    ['Are you licensed and insured to fly drones commercially?', 'Yes. Alex Marzette holds an FAA Part 107 Remote Pilot Certificate and carries liability insurance. A certificate of insurance is available on request, and airspace is checked before every flight, with FAA authorization requested where it’s required.'],
    ['What types of commercial properties do you photograph?', 'Office, medical, retail, restaurant, industrial and flex, multifamily and land across Greater Houston.'],
    ['Can the property owner or another broker use the photos?', `Yes. Each additional company can license the images for ${money(C.addons[5][1])}.`],
  ];
  const typeField = `<div class="field"><label for="cq-type">Property type</label><select id="cq-type" name="property_type">${C.types.map((t) => `<option>${t}</option>`).join('')}</select></div><div class="field"><label for="cq-sqft">Building size (sq ft)</label><input id="cq-sqft" name="sqft" inputmode="numeric" placeholder="e.g. 12,000"></div>`;
  if (SPECIALTY_PAGES) pages['commercial.html'] = head({ file: 'commercial.html', title: 'Commercial Real Estate Photography Houston | Marz Media', desc: `Commercial real estate photography and drone aerials in Houston for office, retail, industrial and multifamily. Packages from ${money(C.packages[0].price)}, drone included.`, image: src(HC, 1600),
    extra: service('Commercial real estate photography', 'Commercial real estate photography and aerial photography', 'Photography, drone aerials, leasing videos and 3D tours for commercial properties in Houston: office, retail, industrial, multifamily and land.', C.packages[0].price, 'commercial') + faqLd(CFAQ) }) +
    header('commercial.html') + `<main id="main">` +
    hero(HC, { short: true, eyebrow: 'Commercial real estate', h1: 'Photos and aerials that lease space.', lede: 'Photography, drone aerials and leasing video for brokers, owners and property managers across Greater Houston. Drone is included in every package.', actions: '<a class="btn btn-light" href="#quote">Request a quote <span class="arr">→</span></a>' }) +
    `<section class="section"><div class="wrap split"><div><span class="eyebrow rv">Why it works</span><h2 class="rv d1">Tenants buy location first.</h2></div><div class="prose rv"><p class="lede">The building matters. Where it sits matters more.</p><p>Every package pairs clean interior and exterior photography with FAA-certified, fully insured drone aerials that show access, parking, visibility and what surrounds the property. That’s what tenants and buyers want to see before they ever schedule a tour.</p></div></div>
<div class="wrap"><div class="creds rv"><div><strong>Drone included</strong><span>Aerials in every package, not an upcharge.</span></div><div><strong>FAA-certified & insured</strong><span>Airspace checked before every flight. Certificate of insurance on request.</span></div><div><strong>Agent’s eye</strong><span>A licensed Texas agent who knows what moves space.</span></div><div><strong>One point of contact</strong><span>Alex plans, shoots and delivers every project.</span></div></div></div></section>` +
    `<section class="section paper" id="packages"><div class="wrap"><span class="eyebrow rv">Packages</span><h2 class="rv d1">Priced by building size.</h2><p class="lede rv d2">Over 50,000 sq ft, a campus or multiple buildings? Custom quotes start at ${money(C.customFrom)}.</p>${pkgCards(C.packages, 'Commercial', 'quote', 'cq-pkg')}
<h3 class="rv" style="margin-top:56px">Add-ons</h3>${addonList(C.addons)}</div></section>` +
    `<section class="section on-dark"><div class="wrap split"><div><span class="eyebrow rv">Property types</span><h2 class="rv d1">From a single suite to a full site.</h2></div><div class="prose rv"><ul><li><strong>Office and medical:</strong> lobbies, suites, common areas and building exteriors.</li><li><strong>Retail and restaurant:</strong> storefronts, frontage, signage and the traffic around it.</li><li><strong>Industrial and flex:</strong> warehouses, docks, yards and truck access from the air.</li><li><strong>Multifamily:</strong> amenities, model units and the whole community.</li><li><strong>Land:</strong> aerials that show boundaries, roads and nearby development.</li></ul></div></div></section>` +
    `<section class="section" id="quote"><div class="wrap split"><div><span class="eyebrow rv">Request a quote</span><h2 class="rv d1">Tell us about the property.</h2><p class="lede rv d2">Alex will follow up with a quote and available dates.</p></div>${quoteForm('Commercial', C.packages, typeField)}</div></section>` +
    faqBlock(CFAQ) + byline('your property') + `</main>` + footer(pickPkg);

  // Interiors + Commercial as sections of the Services page (while SPECIALTY_PAGES is off)
  if (!SPECIALTY_PAGES) {
    const sec = `<section class="section" id="interiors"><div class="wrap"><span class="eyebrow rv">Interior design photography</span><h2 class="rv d1" style="max-width:20ch">Portfolio images for designers, builders and stagers.</h2><p class="lede rv d2">Styled, true-color photos composed around the design: straight lines, accurate materials, and the detail and vignette shots that carry a portfolio or an awards entry. Introductory rates; images delivered in 3–5 business days, with web, social, portfolio and award use included.</p><div class="strip" data-lb>${['a4f01b83', '525bcfc0', '7e21bd8f', '1864f31b'].map(byKey).map((r, i) => fig(r, i + 2)).join('')}</div>${pkgCards(I.packages, 'Interiors', 'interiors-quote', 'iq-pkg')}
<h3 class="rv" style="margin-top:48px">Interior add-ons</h3>${addonList(I.addons)}</div>
<div class="wrap split" id="interiors-quote" style="align-items:start;margin-top:64px"><div><span class="eyebrow rv">Request a quote</span><h3 class="rv d1" style="font-size:clamp(26px,3vw,34px)">Tell us about the project.</h3><p class="rv d2" style="color:var(--muted)">For interior designers, decorators, builders, remodelers, home stagers, short-term rental hosts and showrooms. Alex follows up to talk through the space, your shot list and timing.</p></div>${quoteForm('Interiors', I.packages, '')}</div></section>` +
      `<section class="section paper" id="commercial"><div class="wrap"><span class="eyebrow rv">Commercial real estate</span><h2 class="rv d1" style="max-width:20ch">Photos and aerials that lease space.</h2><p class="lede rv d2">Office, medical, retail, restaurant, industrial, multifamily and land. Every package pairs interior and exterior photography with FAA-certified, insured drone aerials that show access, parking and surroundings. Over 50,000 sq ft, a campus or multiple buildings: custom quotes from ${money(C.customFrom)}.</p><div class="strip" data-lb>${['0fe3661b', '88ee88b0', '360ae8cf', '0e251058'].map(byKey).map((r, i) => fig(r, i + 1)).join('')}</div>${pkgCards(C.packages, 'Commercial', 'commercial-quote', 'cq-pkg')}
<h3 class="rv" style="margin-top:48px">Commercial add-ons</h3>${addonList(C.addons)}</div>
<div class="wrap split" id="commercial-quote" style="align-items:start;margin-top:64px"><div><span class="eyebrow rv">Request a quote</span><h3 class="rv d1" style="font-size:clamp(26px,3vw,34px)">Tell us about the property.</h3><p class="rv d2" style="color:var(--muted)">For brokers, owners and property managers. Alex follows up with a quote and available dates.</p></div>${quoteForm('Commercial', C.packages, typeField)}</div></section>`;
    const anchor = '<section class="section"><div class="wrap split"><div><span class="eyebrow rv">Good to know</span>';
    if (!pages['services.html'].includes(anchor)) throw new Error('services anchor missing');
    pages['services.html'] = pages['services.html'].replace(anchor, sec + anchor).replace('</head>', service('Interior design photography', 'Interior photography', 'Styled interior photography for interior designers, builders, remodelers and home stagers in Houston.', I.packages[0].price, 'services#interiors') + service('Commercial real estate photography', 'Commercial real estate photography and aerial photography', 'Photography and drone aerials for office, retail, industrial, multifamily and land in Houston.', C.packages[0].price, 'services#commercial') + '</head>').replace(/<\/body><\/html>$/, pickPkg + '</body></html>');
  }

  // THANK YOU (after a quote request)
  pages['quote-thanks.html'] = head({ file: 'quote-thanks.html', title: 'Thank You | Marz Media Photography', desc: 'Thanks for your quote request. Alex Marzette will follow up with you shortly.', image: src(HI, 1600) }).replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="x-canonical"') +
    header('') + `<main id="main">` + hero(HI, { eyebrow: 'Request received', h1: 'Thank you. We’ll be in touch.', lede: `Alex will follow up with you shortly. Need something sooner? Call or text ${PHONE}.`, actions: '<a class="btn btn-light" href="index.html">Back home</a>' + BTN_PORT }) + `</main>` + footer(`<script>try{gtag('event','generate_lead',{lead_source:'quote_request'});}catch(e){}</script>`);
}

// FAQ HUB: question-led, answer-first (first sentence answers the question), grouped by topic,
// FAQPage schema, internal links to the page that covers each topic in depth.
{
  const H = byKey('ca539374');
  const pk = P.PACKAGES, it = P.ITEMS;
  const GROUPS = [
    ['pricing', 'Pricing', [
      ['How much does real estate photography cost in Houston?', `At Marz Media, HDR real estate photography starts at ${money(it.hdr.prices[0])} for homes up to 2,499 sq ft, and listing packages with photos, video and twilight start at ${money(pk[0].price)}. Prices are set by the home’s heated square footage and shown up front on the <a href="services.html">pricing page</a>.`],
      ['How much do real estate listing packages cost?', `${pk.map((p) => `${p.name} is ${money(p.price)} (${PKG_DESC[p.id].replace('Homes up', 'up').toLowerCase()})`).join(', ')}. Each includes HDR photography, cinematic video or a reel, and twilight photos.`],
      ['How much does real estate drone photography cost?', `Drone coverage added to a shoot is ${money(it.droneAddon.prices[0])} for homes under 2,500 sq ft and ${money(it.droneAddon.prices[1])} above. A drone-only aerial photo shoot is ${money(it.aerialPhoto.price)}, and aerial video adds ${money(it.aerialVideo.price)}.`],
      ['How much does a real estate video cost?', `Cinematic listing video starts at ${money(it.video.prices[0])} for homes up to 2,499 sq ft. Video is also included in every listing package.`],
      ['How much does virtual staging cost?', `Virtual staging is ${money(it.staging.price)} per photo. Most listings need three: the living room, kitchen and primary bedroom.`],
      ['Is there tax on orders?', 'Yes. A 5% tax is added to every order total.'],
      ['Is there a cancellation fee?', `Yes. Cancelling on the day of the shoot is ${money(P.POLICY.cancelSameDay)}, and cancelling after Alex has arrived at the property is ${money(P.POLICY.cancelOnSite)}. There’s no fee to cancel before the day of the shoot. To cancel or reschedule, call or text ${PHONE}.`],
      ['What’s the difference between a listing package and building your own?', `A listing package bundles HDR photos, cinematic video and twilight photos at one price, starting at ${money(pk[0].price)}. Build your own lets you pick only the services you need, starting at ${money(it.aerialPhoto.price)}.
<div class="rate-wrap"><table class="rate cmp"><caption>Listing package vs. build your own at Marz Media</caption><thead><tr><th></th><th>Listing package</th><th>Build your own</th></tr></thead><tbody>
<tr><th>Best for</th><td>Listings that need photos and video</td><td>Photos only, drone only, or a custom mix</td></tr>
<tr><th>Includes</th><td>HDR photos, cinematic video or reel, 1–2 twilight photos</td><td>Any of: HDR photos, video, drone, 3D tour, floor plans, twilight</td></tr>
<tr><th>Home size</th><td>Up to 5,999 sq ft</td><td>Any size (7,500+ sq ft quoted)</td></tr>
<tr><th>Price</th><td>${pk.map((p) => money(p.price)).join(' / ')}</td><td>From ${money(it.aerialPhoto.price)}</td></tr>
<tr><th>Drone</th><td>Add for ${money(it.droneAddon.prices[0])}–${money(it.droneAddon.prices[1])}</td><td>Add for ${money(it.droneAddon.prices[0])}–${money(it.droneAddon.prices[1])}, or ${money(it.aerialPhoto.price)} drone-only</td></tr>
</tbody></table></div>`],
    ]],
    ['booking', 'Booking & delivery', [
      ['How do I book a real estate photographer in Houston?', 'You can <a href="book.html">book online</a> with live availability: choose a package, build your own or social reels, enter the address and square footage, then pick an open time. You can also call or text ' + PHONE + '.'],
      ['How fast will I get my listing photos?', 'Edited photos are delivered the next business day. Video is delivered within 24–72 hours. Same-day photo delivery is available for ' + money(it.sameday.price) + ' when the shoot starts between 8 and 9 AM.'],
      ['How long does a real estate photo shoot take?', 'A photos-only shoot takes about an hour for most homes. Packages with photos and video take about two hours on site.'],
      ['What days do you shoot?', 'Shoots are available Monday through Saturday, with morning start times as early as 8 AM on most weekdays.'],
      ['What happens if it rains on shoot day?', 'Interior photos and video can usually go ahead. Drone and twilight work depend on the weather, and Alex reschedules those parts with you if conditions aren’t right.'],
      ['What areas do you serve?', `All of Greater Houston, including ${AREAS.map((a) => a.name).slice(0, 8).join(', ')} and more. See all <a href="houston.html">areas served</a>.`],
    ]],
    ['services', 'Services', [
      ['What is HDR real estate photography?', 'HDR (high dynamic range) photography blends several exposures of the same room so bright windows and darker corners both look natural. It produces bright, true-to-life listing photos without blown-out windows.'],
      ['Do I need drone photos to sell my house?', 'Not always, but drone photos help when the lot, the view, the neighborhood or nearby amenities are selling points. They show buyers what ground photos can’t, like acreage, a pool layout or proximity to a lake.'],
      ['What is twilight real estate photography?', 'Twilight photos are taken around sunset with the home’s lights on, creating a warm, glowing hero image. Listing packages include one or two, and they’re ' + money(it.twilight.price) + ' as an add-on.'],
      ['What is virtual staging, and do I have to disclose it?', 'Virtual staging adds furniture and decor to photos of empty rooms digitally. Most MLS rules require that virtually staged photos be disclosed, so check your MLS’s current guidelines before publishing.'],
      ['Do you offer 3D virtual tours and floor plans?', `Yes. 3D virtual tours start at ${money(it.tour3d.prices[0])} and floor plans are ${money(it.floorplan.price)}.`],
      ['Do you shoot social media reels for businesses?', `Yes. Reels for agents, businesses, restaurants and events start at ${money(P.CONTENT.plans[0].price)}, and <a href="services.html#content">monthly content plans</a> start at ${money(P.CONTENT.plans.find((p) => p.monthly).price)} for four reels with drone included.`],
      ['Do you photograph interior design projects?', `Yes. <a href="${SPECIALTY_PAGES ? 'interiors.html' : 'services.html#interiors'}">Interior design photography</a> for designers, builders, remodelers and stagers starts at ${money(P.INTERIORS.packages[0].price)}.`],
      ...(PROPERTY_SITES ? [['Do you offer property websites?', 'Yes. Every shoot includes a free single-property website with the listing’s photos, video, map and agent details, plus an unbranded version for the MLS. It goes live when the photos are delivered.']] : []),
      ['Do you photograph commercial real estate?', `Yes. <a href="${SPECIALTY_PAGES ? 'commercial.html' : 'services.html#commercial'}">Commercial photography</a> for office, retail, industrial, multifamily and land starts at ${money(P.COMMERCIAL.packages[0].price)}, with drone aerials included.`],
    ]],
    ['prep', 'Preparing the home', [
      ['How do I prepare my home for real estate photos?', `To prepare a home for real estate photos, declutter every surface, remove personal items, turn on every light, open all blinds and move cars out of the driveway. The camera’s wide-angle lens shows far more of each room than you notice in person, so small items on counters become prominent in the final photos.
<h3>The day before the shoot</h3><ul><li><strong>Kitchen:</strong> clear the countertops completely, empty the sink, and remove magnets and papers from the refrigerator.</li><li><strong>Bathrooms:</strong> clear vanities and showers of toiletries, hang one set of matching towels, and close toilet lids.</li><li><strong>Throughout:</strong> remove family photos, hide cords and remotes, replace burned-out bulbs, and put away pet beds, bowls and toys.</li><li><strong>Outside:</strong> mow and edge the lawn, put trash bins and hoses out of view, arrange patio furniture, and uncover the pool.</li></ul>
<h3>The morning of the shoot</h3><ul><li>Make every bed with smooth, neutral bedding.</li><li>Straighten pillows and throws, and clear coffee tables to a few pieces.</li><li>Put away laundry, shoes and bags, and close closet doors.</li></ul>
<h3>The final hour before Alex arrives</h3><ol><li>Turn on every light, including lamps and under-cabinet lights.</li><li>Open all blinds and curtains fully.</li><li>Turn off ceiling fans and TVs.</li><li>Move vehicles out of the driveway and away from the front of the home.</li><li>Secure pets, and confirm the lockbox or gate code.</li></ol>
<h3>For drone and twilight photos</h3><p>Leave interior and exterior lights on through sunset for twilight photos. For drone shots, the roof, yard and pool should be clear of debris and covers. Alex checks airspace and HOA rules in advance.</p>
<p>The full room-by-room checklist is in the <a href="prep.html">home prep guide</a>.</p>`],
      ['Do I need to be home during the shoot?', 'No. Many shoots use a lockbox. If someone will be home, plan to keep pets secured and stay out of the rooms being photographed.'],
    ]],
    ['trust', 'About Marz Media', [
      ['Who takes the photos?', 'Alex Marzette, the founder of Marz Media Photography, plans, shoots and edits every job himself. He is a licensed Texas real estate agent with 4+ years photographing Houston properties. <a href="about.html">More about Alex</a>.'],
      ['Are you licensed and insured to fly drones?', 'Yes. Alex holds an FAA Part 107 Remote Pilot Certificate and is insured. He checks airspace and HOA rules before every flight, and a certificate of insurance is available on request.'],
    ]],
  ];
  const all = GROUPS.flatMap(([, , q]) => q);
  pages['faq.html'] = head({ file: 'faq.html', title: 'Real Estate Photography FAQ: Houston | Marz Media', desc: 'Answers on real estate photography in Houston: pricing, drone, video, twilight, virtual staging, delivery times, booking and how to prep your home.', image: src(H, 1600),
    extra: ld({ '@context': 'https://schema.org', '@type': 'FAQPage', dateModified: new Date().toISOString().slice(0, 10), author: { '@id': PERSON['@id'] }, datePublished: '2026-11-02', mainEntity: all.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<div class="rate-wrap">[\s\S]*?<\/div>/g, '').replace(/<\/h3>/g, ': ').replace(/<\/li>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim() } })) }) }) +
    header('faq.html') + `<main id="main">` +
    hero(H, { short: true, eyebrow: 'FAQ', h1: 'Real estate photography, answered.', lede: `Straight answers on pricing, drone, video, delivery and booking across Houston. ${all.length} questions, answered by Alex Marzette.` }) +
    `<section class="section tight"><div class="wrap"><nav class="faq-toc" aria-label="FAQ topics">${GROUPS.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav><p class="hint">By <a class="link" href="about.html">Alex Marzette</a> · Published November 2, 2026 · Updated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' })}</p></div></section>` +
    GROUPS.map(([id, t, qs], gi) => `<section class="section tight${gi % 2 ? ' paper' : ''}" id="${id}"><div class="wrap split" style="align-items:start"><div><span class="eyebrow rv">${t}</span></div><div class="qa">${qs.map(([q, a]) => { const [first, ...rest] = a.split('\n'); return `<article class="rv"><h2>${q}</h2><p>${first}</p>${rest.join('')}</article>`; }).join('')}</div></div></section>`).join('') +
    byline('your listing') + cta(byKey('3ee3861a'), 'Still have a question?', `Call or text ${PHONE}, or book online with live availability.`) + `</main>` + footer();
}

// PRIVACY + ACCESSIBILITY
{
  const H = byKey('3ee3861a');
  const page = (file, title, desc, h1, body) => {
    pages[file] = head({ file, title, desc, image: src(H, 1600) }) + header('') + `<main id="main">` +
      hero(H, { short: true, eyebrow: 'Marz Media Photography', h1 }) +
      `<section class="section"><div class="wrap"><div class="prose">${body}</div></div></section></main>` + footer();
  };
  page('privacy.html', 'Privacy Policy | Marz Media Photography', 'How Marz Media Photography collects, uses and protects the information you share when you book a real estate photo or video shoot in Houston.', 'Privacy policy.',
    `<p><em>Last updated October 2026</em></p>
<p>Marz Media Photography (“Marz Media,” “we,” “us”) is a real estate photography and video business based in Cypress, Texas. This policy explains what information we collect through this website and how we use it.</p>
<h2>What we collect</h2><ul><li><strong>Booking details you provide:</strong> your name, email, phone number, brokerage or business name, the property or shoot address, square footage, access instructions and any notes.</li><li><strong>Basic site usage:</strong> standard technical information such as browser type and pages visited, collected by our hosting and booking providers to keep the site secure and working.</li></ul>
<h2>How we use it</h2><ul><li>To schedule, confirm and deliver your shoot, and to contact you about it.</li><li>To send your invoice and keep business records.</li><li>To respond to questions you send us.</li></ul><p>We do not sell your information, and we do not use it for third-party advertising.</p>
<h2>Who helps us</h2><p>We use trusted service providers to run the business: Wix (online booking and scheduling), Google (calendar and address suggestions), Stripe (invoices and payments) and Netlify (website hosting). They process your information only to provide their services to us. Card payments are handled by Stripe; we never see or store your full card number.</p>
<h2>How long we keep it</h2><p>We keep booking and invoice records for as long as needed to serve you and to meet tax and accounting requirements.</p>
<h2>Your choices</h2><p>You can ask us to access, correct or delete your information at any time by emailing <a href="mailto:${EMAIL}">${EMAIL}</a>. We will respond within a reasonable time.</p>
<h2>Contact</h2><p>Marz Media Photography · Cypress, Texas · <a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${TEL}">${PHONE}</a></p>`);
  page('accessibility.html', 'Accessibility Statement | Marz Media Photography', 'Our commitment to making the Marz Media Photography website easy to use for everyone, and how to reach us if anything gets in your way.', 'Accessibility.',
    `<p>Marz Media Photography wants everyone to be able to browse our work and book a shoot. This website is built with accessibility in mind, including descriptive text on images, keyboard-friendly navigation, readable color contrast and layouts that work on phones, tablets and computers.</p>
<p>If anything on the site is hard to use, or you would prefer to book by phone, call or text <a href="tel:${TEL}">${PHONE}</a> or email <a href="mailto:${EMAIL}">${EMAIL}</a> and we will take care of you directly.</p>`);
}

// 404
pages['404.html'] = head({ file: '404.html', title: 'Page not found | Marz Media', desc: 'This page could not be found.', image: src(byKey('3ee3861a'), 1600) }).replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="x-canonical"') +
  header('') + `<main id="main">` + hero(byKey('3ee3861a'), { eyebrow: '404', h1: 'This room is off the floor plan.', lede: 'The page you were looking for has moved or no longer exists.', actions: '<a class="btn btn-light" href="index.html">Back home</a>' + BTN_PORT }) + `</main>` + footer();

// LOOKBOOK: outreach page sent in IG/Facebook DMs (noindex, not in nav or sitemap). Content in site/lookbook.mjs.
pages['lookbook.html'] = (await import('./lookbook.mjs')).default({ rows, byKey, src, alt, cap, P, money, head, reel, REELS, PERSON, PHONE, TEL, IG, CDN, VER });

/* ---------- write ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
// Clean URLs everywhere (/about, not about.html) so links, canonicals and the sitemap all agree.
const cleanUrls = (h) => h
  .replace(/href="index\.html(?=["#?])/g, 'href="/')
  .replace(/(href=")([a-z0-9-]+)\.html(?=["#?])/g, '$1/$2')
  .replace(/(https:\/\/www\.marzmediaphotography\.com)\/([a-z0-9-]+)\.html/g, '$1/$2');
for (const [f, html] of Object.entries(pages)) fs.writeFileSync(path.join(OUT, f), cleanUrls(html.replace(/\n\s*/g, '\n')));
if (LOCAL) fs.writeFileSync(path.join(OUT, '_redirects'), Object.keys(pages).filter((f) => f !== 'index.html' && f !== '404.html').map((f) => `/${f.replace(/\.html$/, '')}  /${f}  200`).join('\n') + '\n');
const urls = Object.keys(pages).filter((f) => f !== '404.html' && f !== 'quote-thanks.html' && f !== 'lookbook.html');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((f) => `<url><loc>${ORIGIN}/${f === 'index.html' ? '' : f.replace(/\.html$/, '')}</loc>${f === 'portfolio.html' ? rows.map((r) => `<image:image><image:loc>${src(r, 1600).replace(/&/g, '&amp;')}</image:loc></image:image>`).join('') : ''}</url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# Marz Media Photography

> Real estate photography, cinematic video, drone and 3D tours in Houston, Texas. Founded and run by Alex Marzette, a licensed Texas real estate agent and FAA Part 107 certified drone pilot with 4+ years photographing Houston properties. Based in Cypress, TX, serving Greater Houston.

Contact: ${PHONE} · ${EMAIL} · ${ORIGIN}

## Services and pricing
- [Listing packages and à la carte pricing](${ORIGIN}/services): packages from ${money(P.PACKAGES[0].price)} (Essential, up to 2,499 sq ft), ${money(P.PACKAGES[1].price)} (Pro, 2,500–3,999 sq ft), ${money(P.PACKAGES[2].price)} (Signature, 4,000–5,999 sq ft). HDR photos from ${money(P.ITEMS.hdr.prices[0])}, video from ${money(P.ITEMS.video.prices[0])}, aerial photography ${money(P.ITEMS.aerialPhoto.price)}. Photos delivered next business day; video in 24–72 hours.
- [Social media reels](${ORIGIN}/services#content): single reels from ${money(P.CONTENT.plans[0].price)}; monthly content plans from ${money(P.CONTENT.plans.find((p) => p.monthly).price)}/month.
- [Interior design photography](${ORIGIN}/${SPECIALTY_PAGES ? 'interiors' : 'services#interiors'}): for designers, builders, remodelers and stagers; from ${money(P.INTERIORS.packages[0].price)}.
- [Commercial real estate photography](${ORIGIN}/${SPECIALTY_PAGES ? 'commercial' : 'services#commercial'}): office, retail, industrial, multifamily and land, drone included; from ${money(P.COMMERCIAL.packages[0].price)}.

## Key pages
- [Book online](${ORIGIN}/book): live availability.
- [Portfolio](${ORIGIN}/portfolio)
- [About Alex Marzette](${ORIGIN}/about)
- [Home prep checklist](${ORIGIN}/prep)
- [FAQ](${ORIGIN}/faq): pricing, drone, video, delivery, booking and prep questions answered.
- [Areas served](${ORIGIN}/houston)
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), LIVE ? `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
if (LOCAL) {
  const root = path.join(here, '..');
  fs.cpSync(path.join(here, 'assets'), path.join(OUT, 'site', 'assets'), { recursive: true });
  fs.cpSync(path.join(here, 'js'), path.join(OUT, 'site', 'js'), { recursive: true });
  fs.copyFileSync(path.join(root, 'pricing.js'), path.join(OUT, 'pricing.js'));
}
let total = 0; for (const f of fs.readdirSync(OUT).filter((x) => x.includes('.'))) total += fs.statSync(path.join(OUT, f)).size;
console.log(Object.keys(pages).length, 'pages,', Math.round(total / 1024), 'KB');
