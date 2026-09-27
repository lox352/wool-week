const version = "68c80a4f7b0c7b0b";
const assets = ["404.html","assets/RestingHat-B5OgyHfF.js","assets/SettledHat-Ck6NSzZ2.js","assets/index-BcYsGI3V.css","assets/index-DV9GgwhY.js","assets/index-DxVVyilS.js","assets/sww14-shwook-hat--size1-rSkDrxzD.js","assets/sww14-shwook-hat--size2-v1KwMnOH.js","assets/sww14-shwook-hat--size3-HRcKyA_I.js","assets/sww15-baa-ble-hat-BO6pRkLq.js","assets/sww16-crofthoose-hat-B25ixXuC.js","assets/sww17-bousta-beanie-ZyLJ1WTr.js","assets/sww18-merrie-dancers-toorie--yw1-Ddm42Lx4.js","assets/sww18-merrie-dancers-toorie--yw2-CQ61GWLC.js","assets/sww18-merrie-dancers-toorie-gUBK9cVB.js","assets/sww19-roadside-beanie-CIrp6Wfl.js","assets/sww20-katies-kep-Bx80uadu.js","assets/sww21-da-crofters-kep--large-mkmRnqDr.js","assets/sww21-da-crofters-kep--medium-6lAmWFtx.js","assets/sww21-da-crofters-kep--small-DtZ1ZV7N.js","assets/sww21-da-crofters-kep-6lAmWFtx.js","assets/sww22-bonnie-isle-hat--large-BNZafk6G.js","assets/sww22-bonnie-isle-hat--medium-D3ed_G30.js","assets/sww22-bonnie-isle-hat--small-C82BSvG8.js","assets/sww22-bonnie-isle-hat-BhO156ar.js","assets/sww23-buggiflooer-beanie-D0OIiupP.js","assets/sww24-islesburgh-toorie--large-DNg7-kmk.js","assets/sww24-islesburgh-toorie--medium-Bp2Vz7Q3.js","assets/sww24-islesburgh-toorie--small-BwzBUqSr.js","assets/sww24-islesburgh-toorie-DzhXx8Ln.js","assets/sww25-aal-ower-toorie--large-DeLQLfi6.js","assets/sww25-aal-ower-toorie--medium-1RMO80Zw.js","assets/sww25-aal-ower-toorie--small-jQyJuZrt.js","assets/sww25-aal-ower-toorie-Do-LTniD.js","assets/sww26-birsie-beanny--large-DmeUPIfH.js","assets/sww26-birsie-beanny--medium-DbkUbIA0.js","assets/sww26-birsie-beanny--small-64k731pg.js","favicon.svg","fonts/README.md","fonts/fonts.css","fonts/oswald-variable.woff2","fonts/source-sans-3-italic.woff2","fonts/source-sans-3-variable.woff2","index.html","robots.txt"];
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
