self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const shareTargetAction = '/share-target';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === shareTargetAction && event.request.method === 'POST') {
    event.respondWith(Response.redirect('/'));
    event.waitUntil(handleShareTarget(event));
  }
});

async function handleShareTarget(event) {
  const formData = await event.request.formData();
  const sharedData = {
    title: formData.get('title') || '',
    text: formData.get('text') || '',
    url: formData.get('url') || '',
  };

  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  if (windowClients.length === 0) {
    const client = await self.clients.openWindow('/');
    if (client) {
      client.postMessage({ type: 'share-target', payload: sharedData });
    }
    return;
  }

  for (const client of windowClients) {
    client.postMessage({ type: 'share-target', payload: sharedData });
    client.focus();
  }
}
