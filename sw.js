const version = "7aa00be6f3a27f57";
const assets = ["404.html","assets/RestingHat-ySE2y9-t.js","assets/SettledHat-DFo8fCUz.js","assets/index-BrlAOrix.js","assets/index-DxVVyilS.js","assets/index-vo1cgWvG.css","assets/sww14-shwook-hat--size1-IQdYoWy_.js","assets/sww14-shwook-hat--size2-Cur0IayM.js","assets/sww14-shwook-hat--size3-4Wpia5wy.js","assets/sww15-baa-ble-hat-BEhKgCAN.js","assets/sww16-crofthoose-hat-D8PtH10E.js","assets/sww17-bousta-beanie-DnRoIrB7.js","assets/sww18-merrie-dancers-toorie--yw1-CHFVVyCA.js","assets/sww18-merrie-dancers-toorie--yw2-BwaSBBNE.js","assets/sww18-merrie-dancers-toorie-DzbVwOmX.js","assets/sww19-roadside-beanie-Nj8YtqT8.js","assets/sww20-katies-kep-C5iqlnqb.js","assets/sww21-da-crofters-kep-D6dHrBfu.js","assets/sww22-bonnie-isle-hat--large-Bi6Ip0ex.js","assets/sww22-bonnie-isle-hat--medium-CuBbQopA.js","assets/sww22-bonnie-isle-hat--small-CuiuXlL9.js","assets/sww22-bonnie-isle-hat-ktr5Wguv.js","assets/sww23-buggiflooer-beanie-Dg3k_Pd0.js","assets/sww24-islesburgh-toorie-VQSZFRI1.js","assets/sww25-aal-ower-toorie-C7hpntye.js","assets/sww26-birsie-beanny-BOoZVNbM.js","favicon.svg","fonts/README.md","fonts/fonts.css","fonts/oswald-variable.woff2","fonts/source-sans-3-italic.woff2","fonts/source-sans-3-variable.woff2","index.html","robots.txt"];
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
