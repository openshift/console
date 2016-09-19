const services = {
  prometheus: {
    available: null,
    checking: false,
    responseQueue: [],
    baseURL:  'api/kubernetes/api/v1/proxy/namespaces/default/services/prometheus:9090',
    checkURL: 'api/kubernetes/api/v1/proxy/namespaces/default/services/prometheus:9090/metrics',
    check: function(service) {
      $.ajax(service.checkURL)
        .success(respondToAll.bind(this, service, 'available'))
        .fail(respondToAll.bind(this, service, 'unavailable'));
    }
  }
};

const respondToAll = (service, type) => {
  service.available = type === 'available';
  service.responseQueue.forEach((opts) => {
    opts[type](service.baseURL);
  });
}

const check = (service, opts) => {
  service.responseQueue.push(opts);
  if (!service.checking) {
    service.checking = true;
    service.check(service);
  }
}

export const discoverService = (opts) => {
  const service = services[opts.serviceName];
  if (service.available !== null) {
    if (service.available) {
      opts.available(service.baseURL);
    } else {
      opts.unavailable(service.baseURL);
    }
  } else {
    check(service, opts);
  }
}

