// Service Worker for Nexus Esports PWA
const CACHE_NAME = "nexus-esports-v1";
const OFFLINE_URL = "/offline";

// ✅ Add manifest.json to cache
const ASSETS_TO_CACHE = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Caching assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.url.includes("google-analytics")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// Push event
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    data: data.data || {},
    actions: data.actions || [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: data.data?.type || "notification",
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Nexus Esports", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});