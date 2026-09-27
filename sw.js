const version = "7fe6677d5871f3e4";
const assets = ["404.html","assets/RestingHat-DOuTwwtw.js","assets/SettledHat-BIY2BSCK.js","assets/index-8TQ41-8s.js","assets/index-DxVVyilS.js","assets/index-IZ4f2azv.css","assets/sww14-shwook-hat--size1-C_kE-6DQ.js","assets/sww14-shwook-hat--size2-DEnVC-z4.js","assets/sww14-shwook-hat--size3-Ej_5lAHc.js","assets/sww15-baa-ble-hat-BaL7YaTw.js","assets/sww16-crofthoose-hat-B8ij5zsk.js","assets/sww17-bousta-beanie-DQLP838o.js","assets/sww18-merrie-dancers-toorie--yw1-CHFVVyCA.js","assets/sww18-merrie-dancers-toorie--yw2-BwaSBBNE.js","assets/sww18-merrie-dancers-toorie-DzbVwOmX.js","assets/sww19-roadside-beanie-B_Jx5Et2.js","assets/sww20-katies-kep-C5iqlnqb.js","assets/sww21-da-crofters-kep--large-DC4hCpL_.js","assets/sww21-da-crofters-kep--medium-D6dHrBfu.js","assets/sww21-da-crofters-kep--small-BVFWQIF_.js","assets/sww21-da-crofters-kep-D6dHrBfu.js","assets/sww22-bonnie-isle-hat--large-DBgJ6NBA.js","assets/sww22-bonnie-isle-hat--medium-DlnpbHvf.js","assets/sww22-bonnie-isle-hat--small-DEvPHtzx.js","assets/sww22-bonnie-isle-hat-CIV8aFBR.js","assets/sww23-buggiflooer-beanie-Dg3k_Pd0.js","assets/sww24-islesburgh-toorie--large-DRWguHcX.js","assets/sww24-islesburgh-toorie--medium-CePzCKY_.js","assets/sww24-islesburgh-toorie--small-D-5pIm20.js","assets/sww24-islesburgh-toorie-VQSZFRI1.js","assets/sww25-aal-ower-toorie--large-OxhfevcO.js","assets/sww25-aal-ower-toorie--medium-CiVhe1-B.js","assets/sww25-aal-ower-toorie--small-BoDc283j.js","assets/sww25-aal-ower-toorie-CiVhe1-B.js","assets/sww26-birsie-beanny--large-CT3UoqmW.js","assets/sww26-birsie-beanny--medium-D6149-eH.js","assets/sww26-birsie-beanny--small-CImkRUDI.js","favicon.svg","fonts/README.md","fonts/fonts.css","fonts/oswald-variable.woff2","fonts/source-sans-3-italic.woff2","fonts/source-sans-3-variable.woff2","index.html","robots.txt"];
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
