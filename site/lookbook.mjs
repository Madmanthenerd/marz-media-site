// Lookbook: a phone-first portfolio page made to be sent in Instagram / Facebook DMs.
// Live at /lookbook. Not in the nav or sitemap (noindex) — it is an outreach link, not an SEO page.
// Prices come from pricing.js; photos from catalog.tsv. Offers are set in OFFERS below.

/* ---------- offers: edit here ---------- */
// Turn an offer off with on:false. Redemption is manual: the client mentions the code
// when booking (or in a DM) and Alex applies it on the Stripe invoice.
const OFFERS = {
  code: 'WELCOME',
  welcome: { on: false },   // first listing package: free drone coverage + 3 virtually staged photos
  referral: { on: true, amount: 50 }, // $ off the referrer's next shoot when a referred agent books
};

export default function lookbook(h) {
  const { rows, byKey, src, alt, cap, P, money, head, reel, REELS, PERSON, PHONE, TEL, IG, CDN, VER } = h;
  const isKitchen = (r) => /kitchen/.test(r.subject);
  const by = (album) => rows.filter((r) => r.album === album);
  const keys = (list) => list.map(byKey).filter(Boolean);

  const droneVal = P.ITEMS.droneAddon.prices[1];
  const stageVal = 3 * P.ITEMS.staging.price;
  const welcomeVal = droneVal + stageVal;
  const reelFrom = P.CONTENT.plans[0].price;
  const plan6 = P.CONTENT.plans.find((p) => p.id === 'monthly6');

  // Curated by eye from every photo in Wix Media (Nov 2026). Each list is ordered strongest first.
  const ESTATES = [['21a8a82f', 'wide'], ['a8a0a0b0', ''], ['19939799', ''], ['bda0a794', 'wide'], ['a638be84', ''], ['efd40c7b', ''], ['6645f7fa', 'wide']]
    .map(([k, cls]) => ({ r: byKey(k), cls })).filter((x) => x.r);
  const CHAPTERS = [
    { id: 'twilight', name: 'Twilight', line: 'The sunset hero shot that stops the scroll.',
      spec: ['Shot at sunset', `${money(P.ITEMS.twilight.price)} add-on`, 'Included in every package'],
      items: keys(['cc71b813', 'ef45c99d', 'a814aadb', '93427d51', 'b7613ce2', '553bba15', '9a2194a6', '11a5dea3', 'b07a7f6b', 'fcf19c80', '0619538d']) },
    { id: 'kitchens', name: 'Kitchens', line: 'The room that sells the house, shot straight, bright and true to color.',
      spec: ['HDR photography', `from ${money(P.ITEMS.hdr.prices[0])}`, 'Next business day'],
      items: keys(['ab868a02', 'df663b61', 'd14f18eb', 'e90869f9', '10c339fc', '9429220a', 'f0abc8bc', 'd66c1505', '9058c210', 'e353cc81', '3eedf93f']) },
    { id: 'living', name: 'Living spaces', line: 'Volume, light and flow. Every room reads bigger than the floor plan.',
      spec: ['Wide, level, natural', 'Two-story rooms', 'Media and game rooms'],
      items: keys(['d50bf4c3', '79a5de5c', '05b78c56', '321a60e4', '1329ddc0', '11686483', '7f35d8ea', '04832219', '105c1dd5', '48e50cc5', 'aa7fc1c6', '60bdfb37']) },
    { id: 'rooms', name: 'Dining & suites', line: 'Dining rooms, breakfast nooks and primary suites buyers fall for.',
      spec: ['Styled, not staged', 'Window-balanced light', 'Every room covered'],
      items: keys(['559dd9c5', 'f2615a7f', '3178e462', 'eaf43773', 'd35b2fd2', '8a4946c6', '5c06080f', 'f1966f59', '2dfc0740', 'afdd41a5']) },
    { id: 'drone', name: 'Drone', line: 'The lot, the pool, the neighborhood. Buyers see all of it.',
      spec: ['FAA Part 107 certified', `from ${money(P.ITEMS.aerialPhoto.price)}`, `${money(P.ITEMS.droneAddon.prices[0])} on any package`],
      items: keys(['6c3e7370', '8f1ad366', 'a626fa4a', '3ba4e1ea', '779497c5', '498e4e97', 'a7c39049', '07a28447', 'adced197']) },
    { id: 'outdoor', name: 'Exteriors & outdoor living', line: 'Curb appeal and the backyard buyers picture themselves in.',
      spec: ['HDR exteriors', 'Pools and patios', 'Same visit'],
      items: keys(['66f29cfc', '1224ba40', 'c538e548', '51bb564e', '3ee3861a', '93e3b725', '987d71ba', '45f910f0']) },
    { id: 'design', name: 'Interior design', line: 'Styled, editorial frames for designers, builders and stagers.',
      spec: ['Detail and vignettes', `from ${money(P.INTERIORS.packages[0].price)}`, 'Portfolio-ready'],
      items: keys(['8acce589', 'fa326e57', 'd6c48fa6', '13788d42', 'c86552ca', 'a4f01b83', '438b9fef', '0c03f521', '36a6c42b', '8e5979b3', '1e5dad77']) },
    { id: 'commercial', name: 'Commercial', line: 'Office, retail and multifamily, with aerials in every package.',
      spec: ['Drone included', `from ${money(P.COMMERCIAL.packages[0].price)}`, 'Quote in a day'],
      items: by('commercial') },
  ].filter((c) => c.items.length);

  const H = byKey('e97ae12a'); // twilight pool: the hero
  const OG = `https://static.wixstatic.com/media/${H.id}/v1/fill/w_1200,h_630,al_c,q_85,enc_auto/marz-media-lookbook.jpg`;
  const shot = (r, i) => {
    const W = r.h > r.w ? 640 : 1100, Hh = Math.round(W * r.h / r.w);
    return `<figure tabindex="0"><img src="${src(r, W)}" alt="${alt(r, i)}" width="${W}" height="${Hh}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"><figcaption>${cap(r.subject)}</figcaption></figure>`;
  };
  const chapter = (c, n) => `<section class="lk-ch" id="${c.id}" aria-labelledby="${c.id}-h">
<div class="lk-wrap lk-ch-head"><p class="lk-idx">${String(n + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}</p><h2 id="${c.id}-h">${c.name}</h2><p class="lk-line">${c.line}</p><ul class="lk-spec">${c.spec.map((s) => `<li>${s}</li>`).join('')}</ul><p class="lk-hint">${c.items.length} photos · swipe →</p></div>
<div class="lk-strip" data-lb aria-label="${c.name} photos, swipe to see more">${c.items.map(shot).join('')}<a class="lk-more" href="portfolio.html" data-ev="lookbook_full_portfolio">See the full portfolio <span aria-hidden="true">→</span></a></div>
</section>`;

  const offerCard = (img, tag, title, body, foot, ev) => `<article class="lk-offer"><img src="${src(img, 900)}" alt="" width="900" height="${Math.round(900 * img.h / img.w)}" loading="lazy"><div class="lk-offer-in"><span class="lk-tag">${tag}</span><h3>${title}</h3><p>${body}</p>${foot}</div></article>`;
  const codeChip = `<div class="lk-code"><span>Code</span><strong id="lk-code">${OFFERS.code}</strong><button type="button" class="lk-copy" data-copy="${OFFERS.code}" data-ev="lookbook_copy_code">Copy</button></div>`;
  const offers = [
    OFFERS.welcome.on && offerCard(byKey('3ba4e1ea'), `New clients · ${money(welcomeVal)} value`, 'Free drone + 3 staged photos', `Book your first listing package and I’ll add drone coverage (${money(droneVal)}) and virtual staging on three rooms (${money(stageVal)}) at no charge. Mention the code when you book.`, codeChip + `<a class="lk-btn lk-btn-light" href="book.html?package=pro" data-ev="lookbook_book_offer">Book with the offer <span aria-hidden="true">→</span></a>`, ''),
    offerCard(byKey('cc71b813'), `Most booked plan`, `${plan6.reels} reels a month, ${money(plan6.price)}`, `Vertical content for your brand, listings and market updates. Drone included on every shoot. Single reels from ${money(reelFrom)}.`, `<a class="lk-btn lk-btn-light" href="book.html?type=content&amp;plan=monthly6" data-ev="lookbook_book_content">Start a content plan <span aria-hidden="true">→</span></a>`, ''),
    OFFERS.referral.on && offerCard(byKey('86f154c6'), 'Referral', `${money(OFFERS.referral.amount)} off for every agent you send`, `When an agent you refer books their first shoot, your next shoot is ${money(OFFERS.referral.amount)} off. No limit.`, `<a class="lk-btn lk-btn-ghost" href="sms:${TEL}?&amp;body=${encodeURIComponent('Hi Alex, I have an agent to refer:')}" data-ev="lookbook_referral">Text Alex a referral</a>`, ''),
  ].filter(Boolean).join('');

  const PKG_SIZE = Object.fromEntries(P.PACKAGES.map((p) => [p.id, p.size.replace('Homes up', 'Up')]));
  const LUX = P.PACKAGES.filter((p) => p.luxury);
  const estatePkgs = `<div class="lk-wrap"><div class="lk-estpk"><div class="lk-estpk-head"><p class="lk-idx">Estate collection</p><h3>Built for 6,000–9,999 sq ft.</h3><p>Photos with detail shots, cinematic video and reels, drone and aerial video, a full twilight set and floor plans. One booking.</p></div>${LUX.map((p) => `<a class="lk-estpk-card" href="book.html?package=${p.id}" data-ev="lookbook_estate_${p.id}"><span class="lk-estpk-nm">${p.name}</span><span class="lk-estpk-pr">${money(p.price)}</span><span class="lk-estpk-sz">${p.size}</span><s>${money(P.separatePrice(p))} booked separately</s><span class="lk-estpk-go">Book ${p.name} <span aria-hidden="true">→</span></span></a>`).join('')}<a class="lk-estpk-more" href="#pricing" data-ev="lookbook_estate_details">See everything included ↓</a></div></div>`;
  const ORDER = [...LUX, ...P.PACKAGES.filter((p) => !p.luxury)];
  const packages = ORDER.map((p) => `<article class="lk-pkg${p.mostBooked || p.luxury ? ' hot' : ''}"><header><h3>${p.name}</h3>${p.mostBooked ? '<span class="lk-pill">Most booked</span>' : p.luxury ? '<span class="lk-pill">Estate</span>' : ''}</header><p class="lk-price">${money(p.price)}</p><p class="lk-size">${PKG_SIZE[p.id]}</p>${p.luxury ? `<p class="lk-was">${money(P.separatePrice(p))} booked separately</p>` : ''}<ul>${p.includes.map((x) => `<li>${x}</li>`).join('')}</ul><a class="lk-btn ${p.mostBooked || p.luxury ? 'lk-btn-light' : 'lk-btn-ghost'}" href="book.html?package=${p.id}" data-ev="lookbook_book_${p.id}">Book ${p.name}</a></article>`).join('');

  const alexImg = PERSON.image.replace('w_1000,h_1500', 'w_600,h_750');
  const dm = 'https://ig.me/m/marzmediaphotography';

  const css = `<style>
/* Lookbook: night-time editorial, twilight is the thesis. Tokens extend styles.css (--night, --navy, --on-dark). */
.lk{--lk-bg:var(--night);--lk-panel:#0E1320;--lk-line:rgba(238,241,246,.14);--lk-fg:var(--on-dark);--lk-dim:var(--on-dark-muted);--lk-glow:#9DB4E0;color-scheme:dark}
body.lk{background:var(--lk-bg);color:var(--lk-fg);padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}
.lk ::selection{background:var(--navy);color:#fff}
.lk-wrap{max-width:1180px;margin:0 auto;padding-left:max(18px,env(safe-area-inset-left,0px));padding-right:max(18px,env(safe-area-inset-right,0px))}
.lk a{color:inherit}
.lk h1,.lk h2,.lk h3{font-family:var(--display);font-weight:300;letter-spacing:-.02em;line-height:1.02;margin:0;text-wrap:balance}
.lk em{font-style:italic;font-weight:300;color:var(--lk-glow)}
.lk-top{position:absolute;inset:0 0 auto;z-index:5;padding-top:env(safe-area-inset-top,0px)}
.lk-top .lk-wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:16px}
.lk-brand{font:600 15px/1 var(--body);letter-spacing:.24em;text-transform:uppercase;text-decoration:none}
.lk-brand span{font-weight:400;color:var(--lk-dim)}
.lk-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font:600 15px/1 var(--body);letter-spacing:.02em;text-decoration:none;padding:16px 22px;border-radius:999px;border:1px solid transparent;cursor:pointer;transition:background .25s var(--ease),transform .25s var(--ease)}
.lk-btn:active{transform:scale(.98)}
.lk-btn-light{background:#fff;color:var(--ink)!important}
.lk-btn-light:hover{background:var(--paper)}
.lk-btn-ghost{border-color:rgba(238,241,246,.45);background:transparent;color:var(--lk-fg)}
.lk-btn-ghost:hover{background:rgba(255,255,255,.08)}
.lk-btn-sm{padding:11px 16px;font-size:13px}
.lk :focus-visible{outline:2px solid var(--lk-glow);outline-offset:3px}

.lk-hero{position:relative;min-height:min(92svh,820px);display:flex;align-items:flex-end;overflow:hidden;isolation:isolate}
.lk-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;animation:lk-dusk 2.4s var(--ease) both}
.lk-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(7,9,14,.55) 0%,rgba(7,9,14,0) 28%,rgba(7,9,14,.15) 50%,rgba(7,9,14,.92) 88%,var(--lk-bg) 100%)}
@keyframes lk-dusk{from{filter:brightness(1.35) saturate(.6);transform:scale(1.06)}to{filter:none;transform:none}}
.lk-hero .lk-wrap{padding-block:120px 36px;width:100%}
.lk-kicker{font:600 12px/1.4 var(--body);letter-spacing:.22em;text-transform:uppercase;color:var(--lk-glow);margin:0 0 16px}
.lk-hero h1{font-size:clamp(44px,12vw,104px);max-width:11ch}
.lk-lede{font-size:clamp(17px,4.4vw,20px);line-height:1.55;color:var(--lk-fg);opacity:.9;max-width:44ch;margin:18px 0 26px}
.lk-actions{display:flex;flex-wrap:wrap;gap:10px}

.lk-stats{border-block:1px solid var(--lk-line)}
.lk-stats ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr)}
.lk-stats li{padding:18px 14px;border-left:1px solid var(--lk-line);min-width:0}
.lk-stats li:first-child{border-left:0;padding-left:0}
.lk-stats b{display:block;font:300 clamp(24px,6vw,36px)/1 var(--display);letter-spacing:-.02em}
.lk-stats span{display:block;margin-top:6px;font-size:12px;line-height:1.35;color:var(--lk-dim)}
@media (max-width:640px){.lk-stats ul{grid-template-columns:1fr 1fr}.lk-stats li:nth-child(3){border-left:0;padding-left:0}.lk-stats li:nth-child(n+3){border-top:1px solid var(--lk-line)}}

.lk-nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:rgba(7,9,14,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--lk-line)}
body.lk::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:21;background:var(--lk-bg)}
.lk-nav ul{list-style:none;margin:0 auto;padding:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-block:10px}
.lk-nav ul::-webkit-scrollbar{display:none}
.lk-nav a{display:block;white-space:nowrap;text-decoration:none;font:600 13px/1 var(--body);padding:10px 14px;border-radius:999px;border:1px solid var(--lk-line);color:var(--lk-dim)}
.lk-nav a:hover,.lk-nav a.on{color:var(--lk-fg);border-color:var(--lk-glow)}

.lk-ch{padding-block:56px 8px}
.lk-ch-head{display:grid;gap:10px}
.lk-idx{font:500 12px/1 var(--body);letter-spacing:.2em;color:var(--lk-dim);margin:0;font-variant-numeric:tabular-nums}
.lk-ch h2{font-size:clamp(36px,9vw,64px)}
.lk-line{margin:0;color:var(--lk-dim);font-size:16px;max-width:46ch}
.lk-spec{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.lk-spec li{font:600 11px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;padding:8px 10px;border:1px solid var(--lk-line);border-radius:3px;color:var(--lk-fg)}
.lk-strip{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:max(18px,calc((100vw - 1180px)/2 + 18px));padding:22px max(18px,calc((100vw - 1180px)/2 + 18px)) 18px;scrollbar-width:thin;scrollbar-color:var(--lk-line) transparent;overscroll-behavior-x:contain}
.lk-strip figure{flex:none;margin:0;height:min(52vw,460px);scroll-snap-align:start;position:relative;border-radius:6px;overflow:hidden;background:var(--lk-panel);cursor:zoom-in}
.lk-strip img{height:100%;width:auto;max-width:none;display:block;transition:transform .8s var(--ease)}
.lk-strip figure:hover img{transform:scale(1.03)}
.lk-strip figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 12px 10px;font-size:12px;color:#fff;background:linear-gradient(transparent,rgba(7,9,14,.7));opacity:0;transition:opacity .3s}
.lk-strip figure:hover figcaption,.lk-strip figure:focus-visible figcaption{opacity:1}
.lk-more{flex:none;align-self:stretch;width:180px;scroll-snap-align:start;display:flex;align-items:flex-end;padding:18px;border:1px solid var(--lk-line);border-radius:6px;text-decoration:none;font:300 22px/1.15 var(--display)}
.lk-hint{font-size:12px;color:var(--lk-dim);letter-spacing:.06em;margin:4px 0 0}

.lk-estates{padding-block:64px 8px}
.lk-est{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:26px auto 0;max-width:1600px;padding-inline:max(6px,env(safe-area-inset-left,0px)) max(6px,env(safe-area-inset-right,0px))}
.lk-est figure{margin:0;position:relative;overflow:hidden;aspect-ratio:3/2;border-radius:4px;background:var(--lk-panel);cursor:zoom-in}
.lk-est figure.wide{grid-column:1/-1;aspect-ratio:2/1}
.lk-est img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.2s var(--ease)}
.lk-est figure:hover img{transform:scale(1.025)}
.lk-estpk{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr);gap:12px;margin-top:22px;align-items:stretch}
.lk-estpk-head{display:flex;flex-direction:column;gap:6px;padding:4px 10px 4px 0}
.lk-estpk-head h3{font-size:clamp(24px,3vw,32px);margin:0}
.lk-estpk-head p{margin:0;color:var(--lk-dim);font-size:15px;max-width:44ch}
.lk-estpk-card{display:flex;flex-direction:column;gap:4px;padding:20px;border:1px solid var(--lk-glow);border-radius:10px;background:linear-gradient(180deg,rgba(31,58,110,.55),var(--lk-panel) 75%);color:inherit;text-decoration:none;transition:transform .3s var(--ease)}
.lk-estpk-card:hover{transform:translateY(-3px)}
.lk-estpk-card:focus-visible,.lk-estpk-more:focus-visible{outline:2px solid #fff;outline-offset:3px}
.lk-estpk-nm{font:400 22px/1.1 var(--display)}
.lk-estpk-pr{font:300 40px/1.05 var(--display);font-variant-numeric:tabular-nums}
.lk-estpk-sz{font-size:14px;opacity:.8}
.lk-estpk-card s,.lk-was{font-size:13px;opacity:.7;margin:0}
.lk-estpk-go{margin-top:auto;padding-top:10px;font-weight:600;font-size:14px}
.lk-estpk-more{grid-column:1/-1;justify-self:start;color:inherit;font-size:14px;opacity:.85}
.lk-was{text-decoration:line-through}
@media (max-width:760px){.lk-estpk{grid-template-columns:1fr 1fr}.lk-estpk-head{grid-column:1/-1}}
@media (max-width:420px){.lk-estpk{grid-template-columns:1fr}}
.lk-est figcaption{position:absolute;left:0;right:0;bottom:0;padding:48px 18px 14px;background:linear-gradient(transparent,rgba(7,9,14,.78));font:300 clamp(15px,2.2vw,22px)/1.25 var(--display);color:#fff;text-wrap:balance}
@media (max-width:640px){.lk-est{grid-template-columns:1fr;padding-inline:0;gap:4px}.lk-est figure{border-radius:0}.lk-est figure.wide{aspect-ratio:4/3}}
.lk-reels{padding-block:64px 8px}
.lk .reels{grid-auto-columns:min(58vw,240px);gap:10px;padding:22px max(18px,calc((100vw - 1180px)/2 + 18px)) 18px;scroll-padding-inline:max(18px,calc((100vw - 1180px)/2 + 18px))}
.lk .reel{border-radius:8px}

.lk-offers{padding-block:72px 24px}
.lk-sec-head{display:grid;gap:10px;margin-bottom:26px}
.lk-sec-head h2{font-size:clamp(36px,9vw,64px)}
.lk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}
.lk-offer{position:relative;border-radius:10px;overflow:hidden;min-height:440px;display:flex;align-items:flex-end;isolation:isolate;border:1px solid var(--lk-line)}
.lk-offer>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.lk-offer::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(7,9,14,.1),rgba(7,9,14,.55) 40%,rgba(7,9,14,.94))}
.lk-offer-in{padding:22px;display:grid;gap:12px;min-width:0}
.lk-tag{justify-self:start;font:700 11px/1 var(--body);letter-spacing:.16em;text-transform:uppercase;background:var(--navy);color:#fff;padding:8px 10px;border-radius:3px}
.lk-offer h3{font-size:clamp(28px,7vw,36px)}
.lk-offer p{margin:0;color:var(--lk-fg);opacity:.88;font-size:15px;line-height:1.55}
.lk-offer .lk-btn{justify-self:start}
.lk-code{display:flex;align-items:center;gap:10px;justify-self:start;border:1px dashed rgba(238,241,246,.5);border-radius:6px;padding:8px 8px 8px 12px}
.lk-code span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--lk-dim)}
.lk-code strong{font:600 16px/1 var(--body);letter-spacing:.14em}
.lk-copy{font:600 12px/1 var(--body);background:rgba(255,255,255,.12);color:var(--lk-fg);border:0;border-radius:4px;padding:8px 10px;cursor:pointer}
.lk-fine{font-size:12px;color:var(--lk-dim);margin:14px 0 0;max-width:70ch}

.lk-pricing{padding-block:72px 24px}
.lk-pkg{border:1px solid var(--lk-line);border-radius:10px;padding:22px;display:flex;flex-direction:column;gap:6px;background:var(--lk-panel)}
.lk-pkg.hot{border-color:var(--lk-glow);background:linear-gradient(180deg,rgba(31,58,110,.55),var(--lk-panel) 70%)}
.lk-pkg header{display:flex;justify-content:space-between;align-items:center;gap:10px}
.lk-pkg h3{font-size:28px}
.lk-pill{font:700 10px/1 var(--body);letter-spacing:.16em;text-transform:uppercase;background:#fff;color:var(--ink);padding:7px 9px;border-radius:999px}
.lk-price{font:300 52px/1 var(--display);letter-spacing:-.03em;margin:8px 0 0;font-variant-numeric:tabular-nums}
.lk-size{margin:0;color:var(--lk-dim);font-size:14px}
.lk-pkg ul{list-style:none;margin:14px 0 18px;padding:0;display:grid;gap:8px;font-size:15px}
.lk-pkg li{padding-left:20px;position:relative}
.lk-pkg li::before{content:"";position:absolute;left:0;top:.62em;width:10px;height:1px;background:var(--lk-glow)}
.lk-pkg .lk-btn{margin-top:auto}
.lk-also{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:0;margin-top:14px;border:1px solid var(--lk-line);border-radius:10px;overflow:hidden}
.lk-also a{display:flex;justify-content:space-between;gap:12px;padding:16px 18px;text-decoration:none;border-bottom:1px solid var(--lk-line);font-size:15px}
.lk-also a b{font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums}

.lk-full{display:flex;width:100%;margin-top:14px}
.lk-alex{padding-block:72px}
.lk-alex .lk-wrap{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(22px,5vw,64px);align-items:center}
.lk-alex img{width:100%;height:auto;border-radius:10px;aspect-ratio:4/5;object-fit:cover}
.lk-alex h2{font-size:clamp(34px,8vw,56px)}
.lk-alex p{color:var(--lk-dim);font-size:16px;max-width:52ch}
.lk-creds{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:10px}
.lk-creds li{display:flex;gap:12px;align-items:baseline;border-top:1px solid var(--lk-line);padding-top:10px;font-size:15px}
.lk-creds b{font-weight:600;min-width:9ch}
@media (max-width:760px){.lk-alex .lk-wrap{grid-template-columns:1fr}.lk-alex img{max-width:420px}}

.lk-end{position:relative;padding-block:96px;text-align:left;overflow:hidden;isolation:isolate}
.lk-end>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.lk-end::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(7,9,14,.92),rgba(7,9,14,.55))}
.lk-end h2{font-size:clamp(38px,10vw,76px);max-width:13ch}
.lk-contact{margin:22px 0 0;display:grid;gap:4px;color:var(--lk-dim);font-size:15px}
.lk-contact a{color:var(--lk-fg)}
.lk-foot{padding-block:28px;color:var(--lk-dim);font-size:13px;border-top:1px solid var(--lk-line)}
.lk-foot .lk-wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px}

.lk-dock{position:fixed;left:0;right:0;bottom:0;z-index:30;padding:10px max(12px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));background:rgba(7,9,14,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-top:1px solid var(--lk-line)}
.lk-dock div{max-width:560px;margin:0 auto;display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px}
.lk-dock .lk-btn{padding:14px 10px;font-size:14px}
.lk-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);background:#fff;color:var(--ink);font:600 14px/1 var(--body);padding:12px 16px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:40}
.lk-toast.show{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){.lk-hero>img{animation:none}.lk-strip img{transition:none}}
</style>`;

  const estates = `<section class="lk-estates" id="estates" aria-labelledby="estates-h"><div class="lk-wrap lk-ch-head"><p class="lk-idx">Featured</p><h2 id="estates-h">Million-dollar <em>homes.</em></h2><p class="lk-line">Big rooms, big views, big first impressions. This is the standard on every shoot, whatever the price point.</p></div>
<div class="lk-est" data-lb>${ESTATES.map(({ r, cls }, i) => { const W = cls ? 2000 : 1200; return `<figure class="${cls}" tabindex="0"><img src="${src(r, W)}" alt="${alt(r, i)}" width="${W}" height="${Math.round(W * r.h / r.w)}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"><figcaption>${cap(r.subject)}</figcaption></figure>`; }).join('')}</div>${estatePkgs}</section>`;
  const nav = `<nav class="lk-nav" aria-label="Lookbook sections"><ul class="lk-wrap"><li><a href="#estates">Estates</a></li>${CHAPTERS.map((c) => `<li><a href="#${c.id}">${c.name.replace(' & outdoor living', '')}</a></li>`).join('')}<li><a href="#reels">Video</a></li><li><a href="#offers">Offers</a></li><li><a href="#pricing">Pricing</a></li></ul></nav>`;

  const js = `<script>(function(){var d=document;
function ev(n){try{window.gtag&&gtag('event',n,{page:'lookbook'})}catch(e){}}
d.addEventListener('click',function(e){var a=e.target.closest('[data-ev]');if(a)ev(a.getAttribute('data-ev'));});
var t=d.createElement('div');t.className='lk-toast';t.setAttribute('role','status');d.body.appendChild(t);
function toast(m){t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show')},1800);}
d.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-copy');
var ok=function(){toast('Code '+v+' copied')};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(ok,function(){sel()})}else sel();
function sel(){var s=d.getElementById('lk-code'),r=d.createRange();r.selectNodeContents(s);var w=getSelection();w.removeAllRanges();w.addRange(r);toast('Code selected: '+v)}});});
var links=[].slice.call(d.querySelectorAll('.lk-nav a'));
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){links.forEach(function(l){var on=l.getAttribute('href')==='#'+x.target.id;l.classList.toggle('on',on);if(on&&l.scrollIntoView)l.parentNode.parentNode.scrollTo({left:l.offsetLeft-20,behavior:'smooth'})})}})},{rootMargin:'-45% 0px -50% 0px'});
d.querySelectorAll('.lk-ch,#estates,#reels,#offers,#pricing').forEach(function(s){io.observe(s)});}
ev('lookbook_view');})();</script>`;

  const page = head({ file: 'lookbook.html', title: 'Alex Marzette | Marz Media Lookbook', desc: `Twilight, drone, interiors and cinematic reels from across Houston. Shot and edited by Alex Marzette. Photos the next business day.`, image: OG, extra: css })
    .replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="x-canonical"')
    +
`<body class="lk"><header class="lk-top"><div class="lk-wrap"><a class="lk-brand" href="/" data-ev="lookbook_home">Marz<span>Media</span></a><a class="lk-btn lk-btn-light lk-btn-sm" href="book.html" data-ev="lookbook_book_top">Book a shoot</a></div></header>
<main id="main">
<section class="lk-hero"><img src="${src(H, 2000)}" alt="${alt(H, 0)}" width="2000" height="${Math.round(2000 * H.h / H.w)}" fetchpriority="high"><div class="lk-wrap">
<p class="lk-kicker">The Marz Media lookbook</p>
<h1>Your listing, at its <em>best hour.</em></h1>
<p class="lk-lede">Photography, cinematic video, drone and 3D tours for agents, builders and designers. Shot and edited by me, Alex Marzette. Photos the next business day.</p>
<div class="lk-actions"><a class="lk-btn lk-btn-light" href="#twilight" data-ev="lookbook_see_work">See the work <span aria-hidden="true">↓</span></a>${OFFERS.welcome.on ? `<a class="lk-btn lk-btn-ghost" href="#offers" data-ev="lookbook_see_offer">New-client offer</a>` : ''}</div>
</div></section>
<section class="lk-stats" aria-label="At a glance"><div class="lk-wrap"><ul><li><b>4+ yrs</b><span>shooting Houston real estate</span></li><li><b>25+</b><span>shoots a month</span></li><li><b>Next day</b><span>photos, next business day</span></li><li><b>Part 107</b><span>FAA-certified, insured drone</span></li></ul></div></section>
${nav}
${estates}
${CHAPTERS.map(chapter).join('')}
<section class="lk-reels" id="reels" aria-labelledby="reels-h"><div class="lk-wrap lk-ch-head"><p class="lk-idx">Video</p><h2 id="reels-h">Made for the feed.</h2><p class="lk-line">Vertical reels and listing films for Instagram, TikTok and MLS. Tap to play.</p><ul class="lk-spec"><li>Vertical + horizontal</li><li>24–72 hours</li><li>Reels from ${money(reelFrom)}</li></ul></div>
<div class="reels">${REELS.slice(0, 8).map(reel).join('')}</div></section>
<section class="lk-offers" id="offers" aria-labelledby="offers-h"><div class="lk-wrap"><div class="lk-sec-head"><p class="lk-idx">Offers</p><h2 id="offers-h">${OFFERS.welcome.on ? 'Start with a <em>head start.</em>' : 'More ways to <em>win.</em>'}</h2></div>
<div class="lk-grid">${offers}</div>
<p class="lk-fine">${OFFERS.welcome.on ? 'Welcome offer applies to a client’s first listing package. ' : ''}Referral credit applies once the referred agent’s first shoot is complete.${OFFERS.welcome.on ? ' Offers can’t be combined with each other.' : ''}</p></div></section>
<section class="lk-pricing" id="pricing" aria-labelledby="pricing-h"><div class="lk-wrap"><div class="lk-sec-head"><p class="lk-idx">Pricing</p><h2 id="pricing-h">Simple, by square footage.</h2><p class="lk-line">Every package is photos, cinematic video and twilight in one visit. Estate packages add drone, reels and floor plans.</p></div>
<div class="lk-grid">${packages}</div>
<div class="lk-also"><a href="services.html#a-la-carte" data-ev="lookbook_alacarte"><span>HDR photos only</span><b>from ${money(P.ITEMS.hdr.prices[0])}</b></a><a href="services.html#a-la-carte" data-ev="lookbook_alacarte"><span>Drone photos only</span><b>${money(P.ITEMS.aerialPhoto.price)}</b></a><a href="services.html#a-la-carte" data-ev="lookbook_alacarte"><span>3D virtual tour</span><b>from ${money(P.ITEMS.tour3d.prices[0])}</b></a><a href="services.html#interiors" data-ev="lookbook_interiors"><span>Interior design shoots</span><b>from ${money(P.INTERIORS.packages[0].price)}</b></a><a href="services.html#commercial" data-ev="lookbook_commercial"><span>Commercial</span><b>from ${money(P.COMMERCIAL.packages[0].price)}</b></a><a href="services.html" data-ev="lookbook_services"><span>All services & add-ons</span><b>→</b></a></div>
<a class="lk-btn lk-btn-light lk-full" href="services.html" data-ev="lookbook_full_pricing">See full pricing <span aria-hidden="true">→</span></a></div></section>
<section class="lk-alex" aria-labelledby="alex-h"><div class="lk-wrap"><img src="${alexImg}" alt="Alex Marzette, founder of Marz Media Photography" width="600" height="750" loading="lazy"><div>
<p class="lk-idx">Who shoots it</p><h2 id="alex-h">One photographer. <em>Every shoot.</em></h2>
<p>I’m Alex Marzette. I’m a licensed Texas real estate agent, so I shoot the way listings actually sell: the hero shots first, the rooms buyers ask about, and nothing that misrepresents the home. I plan, shoot and edit every job myself, so the quality never changes hands.</p>
<ul class="lk-creds"><li><b>Licensed</b><span>Texas real estate agent</span></li><li><b>Certified</b><span>FAA Part 107 drone pilot, insured</span></li><li><b>Based</b><span>Cypress, serving all of Greater Houston</span></li><li><b>Before this</b><span>6+ years as a pro basketball player</span></li></ul>
</div></div></section>
<section class="lk-end"><img src="${src(byKey('a814aadb'), 1800)}" alt="" width="1800" height="${Math.round(1800 * byKey('a814aadb').h / byKey('a814aadb').w)}" loading="lazy"><div class="lk-wrap">
<h2>Got a listing coming up?</h2>
<div class="lk-actions" style="margin-top:24px"><a class="lk-btn lk-btn-light" href="book.html" data-ev="lookbook_book_end">See open times <span aria-hidden="true">→</span></a><a class="lk-btn lk-btn-ghost" href="${dm}" rel="noopener" data-ev="lookbook_dm">Message on Instagram</a></div>
<p class="lk-contact"><span>Call or text <a href="tel:${TEL}" data-ev="lookbook_call">${PHONE}</a></span><span>Instagram <a href="${IG}" rel="noopener">@marzmediaphotography</a></span></p>
</div></section>
</main>
<footer class="lk-foot"><div class="lk-wrap"><span>© 2026 Marz Media Photography · Houston, Texas</span><a href="/">marzmediaphotography.com</a></div></footer>
<div class="lk-dock"><div><a class="lk-btn lk-btn-light" href="book.html" data-ev="lookbook_book_dock">Book a shoot</a><a class="lk-btn lk-btn-ghost" href="sms:${TEL}" data-ev="lookbook_text_dock">Text</a><a class="lk-btn lk-btn-ghost" href="${dm}" rel="noopener" data-ev="lookbook_dm_dock">DM</a></div></div>
<script src="${CDN}/site/assets/site.js?v=${VER}" defer></script>${js}</body></html>`;
  return page;
}
