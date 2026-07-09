const CACHE_NAME = "osc-cooking-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./recipes/index.json",
  "./recipes/pasta.md",
  "./recipes/curry.md",
  "./recipes/chili.md"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const files = APP_FILES.map((path) => new URL(path, self.registration.scope).toString());
      return cache.addAll(files);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  if (requestUrl.pathname.endsWith(".json") || requestUrl.pathname.endsWith(".md")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request, { ignoreSearch: true });

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  await cacheResponse(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackPath) {
  try {
    const response = await fetch(request);
    await cacheResponse(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });

    if (cachedResponse) {
      return cachedResponse;
    }

    if (fallbackPath) {
      return caches.match(new URL(fallbackPath, self.registration.scope).toString());
    }

    throw error;
  }
}

async function cacheResponse(request, response) {
  if (!response || !response.ok) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}
