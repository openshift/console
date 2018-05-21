/**
 * Shamelessly taken from https://stackoverflow.com/a/2117523/6909941.
 */
const uuidFor = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const pageFromToken = (continueToken) => continueToken ? parseInt(continueToken.replace('toPage', ''), 10) : 0;

const cloneResource = (obj, num) => ({...obj, metadata: {...obj.metadata, name: `${obj.metadata.name}-clone-${num}`, uid: uuidFor()}});

const strippedURLFor = (request) => {
  const url = new URL(request.url);
  url.searchParams.delete('limit');
  url.searchParams.delete('continue');

  return url.toString();
};

let multiplicationFactor = 20;

/**
 * Only match core resource list requests.
 */
const workloads = new Set()
  .add(/\/api\/kubernetes\/apis\/apps\/v1(\/namespaces\/.*)?\/daemonsets(\?(.*))?$/)
  .add(/\/api\/kubernetes\/apis\/apps\/v1(\/namespaces\/.*)?\/deployments(\?(.*))?$/)
  .add(/\/api\/kubernetes\/apis\/apps\/v1(\/namespaces\/.*)?\/replicasets(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/replicationcontrollers(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/persistentvolumeclaims(\?(.*))?$/)
  .add(/\/api\/kubernetes\/apis\/batch\/v1(\/namespaces\/.*)?\/jobs(\?(.*))?$/)
  .add(/\/api\/kubernetes\/apis\/batch\/v1beta1(\/namespaces\/.*)?\/cronjobs(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/pods(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/configmaps(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/secrets(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/resourcequotas(\?(.*))?$/)
  .add(/\/api\/kubernetes\/apis\/extensions\/v1beta1(\/namespaces\/.*)?\/ingresses(\?(.*))?$/)
  .add(/\/api\/kubernetes\/api\/v1(\/namespaces\/.*)?\/services(\?(.*))?$/);

/**
 * Simple Service Worker which multiplies resource list responses for load testing.
 * Also mocks k8s pagination.
 */
self.addEventListener('fetch', (event) => {
  if ([...workloads].some(url => url.test(event.request.url))) {
    event.respondWith((async() => {
      const response = await fetch(strippedURLFor(event.request));
      try {
        const json = await response.json();

        const limit = parseInt(new URL(event.request.url).searchParams.get('limit'), 10);
        const continueToken = new URL(event.request.url).searchParams.get('continue');

        const allItems = json.items.map(item => Array.from(Array(multiplicationFactor)).map((_, i) => cloneResource(item, i)).concat([item]))
          .reduce((flattened, items) => flattened.concat(items), []);

        json.items = limit
          ? allItems.slice(pageFromToken(continueToken) * limit, (pageFromToken(continueToken) + 1) * limit)
          : allItems;

        if (limit && pageFromToken(continueToken) < (allItems.length / limit)) {
          json.metadata.continue = `toPage${pageFromToken(continueToken) + 1}`;
        }

        return new Response(new Blob([JSON.stringify(json)], {type: 'application/json'}), {headers: response.headers});
      } catch (e) {
        return response;
      }
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

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
