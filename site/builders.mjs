// Builder lookbook: a phone-first page sent to home builders and community developers.
// Live at /builders. Not in the nav or sitemap (noindex) — an outreach link, not an SEO page.
// Prices come from pricing.js (BUILDERS); photos from catalog.tsv. Styles shared with the lookbook (LK_CSS).
import { LK_CSS } from './lookbook.mjs';

export default function builders(h) {
  const { byKey, src, alt, cap, P, money, head, reel, REELS, PERSON, PHONE, TEL, IG, CDN, VER } = h;
  const B = P.BUILDERS;
  const EMAIL = 'admin@marzmediaphotography.com';
  const keys = (list) => list.map(byKey).filter(Boolean);
  const mail = (subject) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

  // Curated from the lookbook picks (Nov 2026), ordered strongest first.
  const CHAPTERS = [
    { id: 'models', name: 'Model homes', line: 'Staged models shot like a magazine, so buyers walk in already sold.',
      spec: ['40–50 HDR photos', 'Video + Matterport', `from ${money(B.model.prices[0][1])}`],
      items: keys(['a8a0a0b0', '19939799', 'bda0a794', 'efd40c7b', '05b78c56', 'd50bf4c3', '3178e462', 'f2615a7f', '321a60e4', '6645f7fa', 'a638be84']) },
    { id: 'spec', name: 'Spec homes', line: 'Move-in-ready inventory, shot fast and consistent across every floor plan.',
      spec: ['25–30 HDR photos', 'Drone + floor plan', `from ${money(B.spec.prices[0][1])}`],
      items: keys(['c538e548', 'ab868a02', 'e90869f9', '3ee3861a', 'd14f18eb', '10c339fc', '79a5de5c', '93e3b725', '66f29cfc', '51bb564e']) },
    { id: 'communities', name: 'Communities & amenities', line: 'Amenity centers, pools, lakes and streetscapes from the air. The lifestyle buyers are paying for.',
      spec: ['FAA Part 107 certified', 'Aerials + flyover video', `from ${money(B.community[0][1])}`],
      items: keys(['07a28447', 'a7c39049', '779497c5', 'adced197', '498e4e97', '3a5ace92', '8f1ad366']) },
    { id: 'twilight', name: 'Twilight', line: 'The model-home hero shot for your site, signage and ads.',
      spec: ['5 twilight images', `+${money(B.addons[2][1][0])}`, 'Same visit'],
      items: keys(['cc71b813', 'ef45c99d', 'a814aadb', '93427d51', 'b7613ce2', '553bba15']) },
  ].filter((c) => c.items.length);

  const H = byKey('a8a0a0b0'); // two-story family room: the hero
  const OG = `https://static.wixstatic.com/media/${H.id}/v1/fill/w_1200,h_630,al_c,q_85,enc_auto/marz-media-builders.jpg`;
  const shot = (r, i) => {
    const W = r.h > r.w ? 640 : 1100, Hh = Math.round(W * r.h / r.w);
    return `<figure tabindex="0"><img src="${src(r, W)}" alt="${alt(r, i)}" width="${W}" height="${Hh}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"><figcaption>${cap(r.subject)}</figcaption></figure>`;
  };
  const chapter = (c, n) => `<section class="lk-ch" id="${c.id}" aria-labelledby="${c.id}-h">
<div class="lk-wrap lk-ch-head"><p class="lk-idx">${String(n + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}</p><h2 id="${c.id}-h">${c.name}</h2><p class="lk-line">${c.line}</p><ul class="lk-spec">${c.spec.map((s) => `<li>${s}</li>`).join('')}</ul><p class="lk-hint">${c.items.length} photos · swipe →</p></div>
<div class="lk-strip" data-lb aria-label="${c.name} photos, swipe to see more">${c.items.map(shot).join('')}</div>
</section>`;

  // Price tables: rows are sizes, columns are 1–4 homes and 5+ homes a month.
  const table = (svc, cls = '') => `<article class="lk-pkg bd-price${cls}"><header><h3>${svc.name}s</h3></header><ul>${svc.includes.map((x) => `<li>${x}</li>`).join('')}</ul>
<table class="bd-t"><thead><tr><th scope="col">Sq ft</th><th scope="col">1–4 a month</th><th scope="col">5+ a month</th></tr></thead><tbody>${svc.prices.map((p, i) => `<tr><th scope="row">${B.sizes[i].replace(' sq ft', '')}</th><td>${money(p[0])}</td><td><b>${money(p[1])}</b></td></tr>`).join('')}</tbody></table></article>`;
  const addons = `<div class="lk-also">${B.addons.map(([n, p, unit]) => `<a href="${mail('Builder pricing: ' + n)}" data-ev="builders_addon"><span>${n}</span><b>+${money(p[0])}${unit ? ' ' + unit : ''}</b></a>`).join('')}${B.community.map(([n, p, note]) => `<a href="${mail('Builder pricing: ' + n)}" data-ev="builders_community"><span>${n}${note ? ` <small>· ${note}</small>` : ''}</span><b>${money(p)}</b></a>`).join('')}</div>`;
  const plans = B.plans.map((p) => `<article class="lk-pkg${p.mostBooked ? ' hot' : ''}"><header><h3>${p.name}</h3>${p.mostBooked ? '<span class="lk-pill">Best value</span>' : ''}</header><p class="lk-price">${money(p.price)}<small>/mo</small></p>${p.value ? `<p class="lk-was">${money(p.value)} booked separately</p>` : '<p class="lk-size">Volume rate, every month</p>'}<ul>${p.includes.map((x) => `<li>${x}</li>`).join('')}</ul><a class="lk-btn ${p.mostBooked ? 'lk-btn-light' : 'lk-btn-ghost'}" href="${mail(`Builder plan: ${p.name}`)}" data-ev="builders_plan_${p.id}">Ask about the ${p.name}</a></article>`).join('');

  const steps = [
    ['Send the addresses', 'Email or text the homes that are ready. Models, spec homes or a whole phase.'],
    ['Batched by community', 'Homes in the same community are shot on the same visit, so nothing waits.'],
    ['Delivered fast', 'Photos the next business day. Video and Matterport tours in 24–72 hours.'],
    ['Organized for your team', 'One folder per community, sized for your website, HAR, Zillow and print.'],
  ];

  const css = LK_CSS + `<style>
.bd-price ul{margin:10px 0 14px}
.bd-t{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;margin-top:auto}
.bd-t th,.bd-t td{text-align:left;padding:12px 8px;border-top:1px solid var(--lk-line);font-size:15px;font-weight:400}
.bd-t thead th{font:600 11px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--lk-dim);border-top:0;padding-top:0}
.bd-t th[scope=row]{color:var(--lk-dim);font-size:14px}
.bd-t td:last-child,.bd-t th:last-child{text-align:right}
.bd-t td b{font:400 22px/1 var(--display);color:var(--lk-fg)}
.lk-price small{font:400 16px/1 var(--body);color:var(--lk-dim);margin-left:4px}
.lk-also small{color:var(--lk-dim);font-size:13px}
.bd-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px;counter-reset:s}
.bd-steps li{border-top:1px solid var(--lk-glow);padding-top:16px;counter-increment:s}
.bd-steps li::before{content:counter(s,decimal-leading-zero);display:block;font:500 12px/1 var(--body);letter-spacing:.2em;color:var(--lk-dim);margin-bottom:12px}
.bd-steps h3{font-size:26px;margin-bottom:8px}
.bd-steps p{margin:0;color:var(--lk-dim);font-size:15px;line-height:1.55}
.bd-how,.bd-plans{padding-block:72px 24px}
</style>`;

  const nav = `<nav class="lk-nav" aria-label="Builder lookbook sections"><ul class="lk-wrap">${CHAPTERS.map((c) => `<li><a href="#${c.id}">${c.name.replace(' & amenities', '')}</a></li>`).join('')}<li><a href="#reels">Video</a></li><li><a href="#pricing">Pricing</a></li><li><a href="#plans">Plans</a></li><li><a href="#how">How it works</a></li></ul></nav>`;

  const js = `<script>(function(){var d=document;
function ev(n){try{window.gtag&&gtag('event',n,{page:'builders'})}catch(e){}}
d.addEventListener('click',function(e){var a=e.target.closest('[data-ev]');if(a)ev(a.getAttribute('data-ev'));});
var links=[].slice.call(d.querySelectorAll('.lk-nav a'));
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){links.forEach(function(l){var on=l.getAttribute('href')==='#'+x.target.id;l.classList.toggle('on',on);if(on)l.parentNode.parentNode.scrollTo({left:l.offsetLeft-20,behavior:'smooth'})})}})},{rootMargin:'-45% 0px -50% 0px'});
d.querySelectorAll('.lk-ch,#reels,#pricing,#plans,#how').forEach(function(s){io.observe(s)});}
ev('builders_view');})();</script>`;

  const alexImg = PERSON.image.replace('w_1000,h_1500', 'w_600,h_750');
  const quote = mail('Builder pricing for [community]');
  const BUILDER_REELS = ['e01b49b060d4453bb363e8cab27ade3c', '338ed0e12280445b8c8a47f5f46fbcbb', '3bda098489c14c6082cf5e0362e947a9', '74492e17923b4db9b15b388ec5274180', '273050ae587c4e03afe9cb800399074e', '3875bd1d477c4495bbedfe19412c9e87', '2ccdf7eae9c84accbd515aa7ac7e80c2', '7688ad7e108c458081c62f7db7879fe0']
    .map((id) => REELS.find(([r]) => r === id)).filter(Boolean);
  const endImg = byKey('ef45c99d') || H;

  return head({ file: 'builders.html', title: 'Alex Marzette | Marz Media for Home Builders', desc: 'Model homes, spec homes, Matterport tours, floor plans, drone and video for Houston home builders. Shot and edited by Alex Marzette.', image: OG, extra: css })
    .replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="x-canonical"')
    +
`<body class="lk"><header class="lk-top"><div class="lk-wrap"><a class="lk-brand" href="/" data-ev="builders_home">Marz<span>Media</span></a><a class="lk-btn lk-btn-light lk-btn-sm" href="${quote}" data-ev="builders_quote_top">Get builder pricing</a></div></header>
<main id="main">
<section class="lk-hero"><img src="${src(H, 2000)}" alt="${alt(H, 0)}" width="2000" height="${Math.round(2000 * H.h / H.w)}" fetchpriority="high"><div class="lk-wrap">
<p class="lk-kicker">For Houston home builders</p>
<h1>Every model. Every spec home. <em>One vendor.</em></h1>
<p class="lk-lede">Photos, video, Matterport tours, floor plans and drone for builders and communities across Greater Houston. Shot and edited by me, Alex Marzette. Photos the next business day.</p>
<div class="lk-actions"><a class="lk-btn lk-btn-light" href="#models" data-ev="builders_see_work">See the work <span aria-hidden="true">↓</span></a><a class="lk-btn lk-btn-ghost" href="#pricing" data-ev="builders_see_pricing">Builder pricing</a></div>
</div></section>
<section class="lk-stats" aria-label="At a glance"><div class="lk-wrap"><ul><li><b>Builder-tested</b><span>models and spec homes for production builders</span></li><li><b>Next day</b><span>photos, next business day</span></li><li><b>All-in-one</b><span>photo, video, 3D, plans, drone</span></li><li><b>Part 107</b><span>FAA-certified, insured drone</span></li></ul></div></section>
${nav}
${CHAPTERS.map(chapter).join('')}
<section class="lk-reels" id="reels" aria-labelledby="reels-h"><div class="lk-wrap lk-ch-head"><p class="lk-idx">Video</p><h2 id="reels-h">Model home video.</h2><p class="lk-line">Cinematic walkthroughs and vertical reels for your site, social and ads. Tap to play.</p><ul class="lk-spec"><li>Vertical + horizontal</li><li>24–72 hours</li><li>Included with every model</li></ul></div>
<div class="reels">${BUILDER_REELS.map(reel).join('')}</div></section>
<section class="lk-pricing" id="pricing" aria-labelledby="pricing-h"><div class="lk-wrap"><div class="lk-sec-head"><p class="lk-idx">Pricing</p><h2 id="pricing-h">Simple, per home. <em>Better by volume.</em></h2><p class="lk-line">Book 5 or more homes in a month and every home drops to the volume rate.</p></div>
<div class="lk-grid">${table(B.model, ' hot')}${table(B.spec)}</div>
${addons}</div></section>
<section class="bd-plans" id="plans" aria-labelledby="plans-h"><div class="lk-wrap"><div class="lk-sec-head"><p class="lk-idx">Monthly plans</p><h2 id="plans-h">One community. <em>One plan.</em></h2><p class="lk-line">Lock the volume rate even in a slow month, with priority scheduling for your homes.</p></div>
<div class="lk-grid">${plans}</div></div></section>
<section class="bd-how" id="how" aria-labelledby="how-h"><div class="lk-wrap"><div class="lk-sec-head"><p class="lk-idx">How it works</p><h2 id="how-h">Built around <em>your release calendar.</em></h2></div>
<ol class="bd-steps">${steps.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
<p class="lk-fine">Unlimited use for your own marketing for the life of the community: website, NewHomeSource, HAR, Zillow, print, signage and social. W-9 and certificate of insurance on request.</p></div></section>
<section class="lk-alex" aria-labelledby="alex-h"><div class="lk-wrap"><img src="${alexImg}" alt="Alex Marzette, founder of Marz Media Photography" width="600" height="750" loading="lazy"><div>
<p class="lk-idx">Who shoots it</p><h2 id="alex-h">One photographer. <em>Every home.</em></h2>
<p>I’m Alex Marzette. I’ve shot model homes, spec homes, drone, Matterport and floor plans for production builders across Houston. I’m also a licensed Texas real estate agent, so I shoot the way new homes actually sell. I plan, shoot and edit every job myself, so the quality is the same on your first home and your hundredth.</p>
<ul class="lk-creds"><li><b>Certified</b><span>FAA Part 107 drone pilot, insured</span></li><li><b>Licensed</b><span>Texas real estate agent</span></li><li><b>Based</b><span>Cypress, serving all of Greater Houston</span></li><li><b>Before this</b><span>6+ years as a pro basketball player</span></li></ul>
</div></div></section>
<section class="lk-end"><img src="${src(endImg, 1800)}" alt="" width="1800" height="${Math.round(1800 * endImg.h / endImg.w)}" loading="lazy"><div class="lk-wrap">
<h2>Got homes ready to shoot?</h2>
<div class="lk-actions" style="margin-top:24px"><a class="lk-btn lk-btn-light" href="${quote}" data-ev="builders_quote_end">Email Alex <span aria-hidden="true">→</span></a><a class="lk-btn lk-btn-ghost" href="sms:${TEL}?&amp;body=${encodeURIComponent('Hi Alex, I have homes for you to shoot:')}" data-ev="builders_text_end">Text the addresses</a></div>
<p class="lk-contact"><span>Call or text <a href="tel:${TEL}" data-ev="builders_call">${PHONE}</a></span><span>Email <a href="mailto:${EMAIL}">${EMAIL}</a></span><span>Instagram <a href="${IG}" rel="noopener">@marzmediaphotography</a></span></p>
</div></section>
</main>
<footer class="lk-foot"><div class="lk-wrap"><span>© 2026 Marz Media Photography · Houston, Texas</span><a href="/lookbook">See the full lookbook</a></div></footer>
<div class="lk-dock"><div><a class="lk-btn lk-btn-light" href="${quote}" data-ev="builders_quote_dock">Email Alex</a><a class="lk-btn lk-btn-ghost" href="sms:${TEL}" data-ev="builders_text_dock">Text</a><a class="lk-btn lk-btn-ghost" href="tel:${TEL}" data-ev="builders_call_dock">Call</a></div></div>
<script src="${CDN}/site/assets/site.js?v=${VER}" defer></script>${js}</body></html>`;
}
