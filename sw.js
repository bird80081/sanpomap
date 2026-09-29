// 離線用：網頁檔案走「網路優先、失敗讀快取」，有網路時永遠拿最新版；
// Google 字型與封面照片（Unsplash）走「快取優先」。Firebase 等其他網域不攔截，交給 app.js 自己處理。
const CACHE = "sanpomap-v27";
const CORE = ["./", "index.html", "style.css", "theme.css", "data.js", "app.js", "maps.js", "assets/coastal-train-editorial.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;

  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))));
    return;
  }

  if (url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com" || url.host === "images.unsplash.com") {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
