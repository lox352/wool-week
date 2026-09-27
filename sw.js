const version = "fa0f5a8d0f173e23";
const assets = ["404.html","assets/RestingHat-eHYpKC3P.js","assets/SettledHat-Coh_6mA6.js","assets/index-BY6M6h87.js","assets/index-DxVVyilS.js","assets/index-wmL8JDkt.css","assets/sww14-shwook-hat--size1-n9MeGnUC.js","assets/sww14-shwook-hat--size2-CQLYqXxR.js","assets/sww14-shwook-hat--size3-Dby93ioF.js","assets/sww15-baa-ble-hat-Cz2SDaj3.js","assets/sww16-crofthoose-hat-D3eHEfN6.js","assets/sww17-bousta-beanie-DCdBvBCj.js","assets/sww18-merrie-dancers-toorie--yw1-Ddm42Lx4.js","assets/sww18-merrie-dancers-toorie--yw2-CQ61GWLC.js","assets/sww18-merrie-dancers-toorie-gUBK9cVB.js","assets/sww19-roadside-beanie-BG7OZulr.js","assets/sww20-katies-kep-Bx80uadu.js","assets/sww21-da-crofters-kep--large-mkmRnqDr.js","assets/sww21-da-crofters-kep--medium-6lAmWFtx.js","assets/sww21-da-crofters-kep--small-DtZ1ZV7N.js","assets/sww21-da-crofters-kep-6lAmWFtx.js","assets/sww22-bonnie-isle-hat--large-DJjQzS0o.js","assets/sww22-bonnie-isle-hat--medium-NXyX9iZc.js","assets/sww22-bonnie-isle-hat--small-Hj_56enl.js","assets/sww22-bonnie-isle-hat-DUiaczvF.js","assets/sww23-buggiflooer-beanie-D0OIiupP.js","assets/sww24-islesburgh-toorie--large-DNg7-kmk.js","assets/sww24-islesburgh-toorie--medium-Bp2Vz7Q3.js","assets/sww24-islesburgh-toorie--small-BwzBUqSr.js","assets/sww24-islesburgh-toorie-DzhXx8Ln.js","assets/sww25-aal-ower-toorie--large-DxfH-6cS.js","assets/sww25-aal-ower-toorie--medium-Do-LTniD.js","assets/sww25-aal-ower-toorie--small-CgH7its7.js","assets/sww25-aal-ower-toorie-Do-LTniD.js","assets/sww26-birsie-beanny--large-B5xQZv9T.js","assets/sww26-birsie-beanny--medium-D_bS8KoE.js","assets/sww26-birsie-beanny--small-CCocfzk6.js","favicon.svg","fonts/README.md","fonts/fonts.css","fonts/oswald-variable.woff2","fonts/source-sans-3-italic.woff2","fonts/source-sans-3-variable.woff2","index.html","robots.txt"];
const prefix = "wool-week-static-";
const cacheName = prefix + version;
const urlFor = path => new URL(path, self.registration.scope).href;
const urls = assets.map(urlFor);

self.addEventListener("install", event => {
  // addAll is atomic: a failed download must not advertise offline readiness.
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(urls)));
  // No skipWaiting: keep an open knitting session on one coherent release.
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin) return;
  const home = request.mode === "navigate" &&
    (url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`);
  const key = home ? urlFor("index.html") : url.href;
  if (!home && !urls.includes(key)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(cacheName)).match(key);
    return cached ?? fetch(request);
  })());
});
