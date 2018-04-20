/**
 * Shamelessly taken from https://stackoverflow.com/a/2117523/6909941.
 */
const uuidFor = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const clonePod = (pod, num) => ({...pod, metadata: {...pod.metadata, name: `${pod.metadata.name}-clone-${num}`, uid: uuidFor()}});

let multiplicationFactor = 50;

/**
 * Simple Service Worker which multiplies every `/api/kubernetes/api/v1/pods` response for load testing.
 */
self.addEventListener('fetch', (event) => {
  if (/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/pods/.test(event.request.url)) {
    event.respondWith((async() => {
      const response = await fetch(event.request);
      const json = await response.json();

      json.items = json.items.map(item => Array.from(Array(multiplicationFactor)).map((_, i) => clonePod(item, i)).concat([item]))
        .reduce((flattened, items) => flattened.concat(items), []);

      return new Response(new Blob([JSON.stringify(json)], {type: 'application/json'}), {headers: response.headers});
    })());
  }
});

self.addEventListener('message', (event) => {
  switch (event.data.topic) {
    case 'setFactor':
      multiplicationFactor = event.data.value;
      break;
    default:
      throw 'No topic on incoming message to load test worker';
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
