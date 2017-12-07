// Service discovery
// Searches to see if your kubernetes cluster has a service.
// If the service is found, perform a health check, and notify callbacks.
// Results are cached, so we don't have to keep re-determining availability with each request.
// If more than one service is found, it chooses the first.

import { coFetch, coFetchUtils } from '../../co-fetch';
import { k8sBasePath } from './k8s';

const cacheExpireThreshold = 2 * 60 * 1000; // 2 minutes
const serviceCache = {};

const cacheKey = (opts) => {
  return [opts.namespace, opts.labelSelector, opts.portName, opts.healthCheckPath].join('_');
};

const cacheExpired = (service) => {
  return service && service.lastCheckedAt && Date.now() - service.lastCheckedAt >= cacheExpireThreshold;
};

const propagateCallback = (opts, service) => {
  if (service.available) {
    opts.available(service.apiPath);
  } else {
    opts.unavailable(service.apiPath);
  }
};

const propagateCallbackQueue = (service, type) => {
  service.available = type === 'available';
  service.discovering = false;
  service.lastCheckedAt = Date.now();
  while (service.responseQueue.length > 0) {
    const opts = service.responseQueue.shift();
    opts[type](service.apiPath);
  }
};

// create the service for the first time, or reset the cached version
const createService = (key, opts) => {
  return serviceCache[key] = {
    available: null,
    discovering: false,
    responseQueue: [],
    apiPath: null,
    lastCheckedAt: null,
    namespace: opts.namespace || null,
    portName: opts.portName || null,
    labelSelector: opts.labelSelector || null,
    healthCheckPath: opts.healthCheckPath || '/'
  };
};

const addCallbackToQueue = (opts, service) => {
  service.responseQueue.push(opts);
};

const apiPath = (service, k8sService) => {
  let port;
  if (service.portName) {
    port = _.find(k8sService.spec.ports, p => p.name === service.portName);
  } else {
    port = k8sService.spec.ports[0];
  }

  if (!port) {
    return null;
  }

  return `${k8sBasePath}/api/v1/proxy/namespaces/${k8sService.metadata.namespace}/services/${k8sService.metadata.name}:${port.port}`;
};

const check = (service) => {
  const namespaceQuery = service.namespace ? `/namespaces/${service.namespace}` : '';
  const labelQuery = service.labelSelector ? `?labelSelector=${encodeURIComponent(service.labelSelector)}` : '';
  coFetch(`${k8sBasePath}/api/v1${namespaceQuery}/services/${labelQuery}`)
    .then(coFetchUtils.parseJson)
    .then((json) => {
      if (!json || !json.items || json.items.length < 1) {
        propagateCallbackQueue(service, 'unavailable');
        return;
      }

      service.apiPath = apiPath(service, json.items[0]);
      if (!service.apiPath) {
        propagateCallbackQueue(service, 'unavailable');
        return;
      }

      coFetch(service.apiPath + service.healthCheckPath)
        .then(propagateCallbackQueue.bind(this, service, 'available'))
        .catch(propagateCallbackQueue.bind(this, service, 'unavailable'));
    })
    .catch(propagateCallbackQueue.bind(this, service, 'unavailable'));
};

// Options:
// namespace       (string): limit the search by namespace
// labelSelector   (string): labelSelector string to search by
// healthCheckPath (string): path, appended to the service proxy path, to
//                             verify the service is available. defaults to '/'
// portName        (string): port name to choose from the service's ports.
//                             if not provided, uses the first port in the list
// * available   (function): callback for if the service is found & healthy.
//                             passes back the basePath to the service proxy
// * unavailable (function): callback for if the service is anything but available
//                             passes back the basePath to the service proxy if it
//                             was able to determine one
export const discoverService = (opts) => {
  const key = cacheKey(opts);
  const cachedService = serviceCache[key];

  if (cachedService && cachedService.lastCheckedAt > 0) {
    // this service was already found, don't block incoming requests.
    // if the cache expired, update it in the background
    propagateCallback(opts, cachedService);
    if (cacheExpired(cachedService) && !cachedService.discovering) {
      cachedService.discovering = true;
      check(cachedService);
    }
  } else if (cachedService && cachedService.discovering) {
    addCallbackToQueue(opts, cachedService);
  } else {
    const service = createService(key, opts);
    service.discovering = true;
    addCallbackToQueue(opts, service);
    check(service);
  }
};
