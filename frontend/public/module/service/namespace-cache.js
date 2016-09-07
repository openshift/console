angular.module('bridge.service')
.factory('namespaceCacheSvc', function(_, $rootScope, k8s, Firehose) {
  // just eagerly load'um up and keep track of them.
  const namespaces = k8s.namespaces;
  var ret = {
    cacheVersion: 0,
    loadError: false,
    get: function(nsName) {
      return _.find(ret.namespaces || [], function(ns) {
        return ns.metadata.name === nsName;
      });
    },
    create: function(spec) {
      return namespaces.create(spec);
    },
    delete: function(namespace) {
      return namespaces.delete(namespace);
    }
  };
  new Firehose(k8s.namespaces)
    .watchList()
    .bindScope($rootScope, null, state => {
      ret.namespaces = _.sortBy(state.namespaces, function(ns) {
        return ns.metadata.name;
      });
      ret.loadError = state.loadError;
      ret.cacheVersion += 1;
    });

  return ret;
});
