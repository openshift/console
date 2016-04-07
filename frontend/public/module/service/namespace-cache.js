angular.module('bridge.service')
  .factory('namespaceCacheSvc', function(_, $rootScope, k8s) {
  // We need a list of namespaces as part of the base UI, so we can
  // just eagerly load'um up and keep track of them.

  var reloadLater = _.debounce(reload, 250);

  var ret = {
    cacheVersion: 0,
    loadError: false,
    get: function(nsName) {
      return _.find(ret.namespaces, function(ns) {
        return ns.metadata.name === nsName;
      });
    },
    create: function(spec) {
      return k8s.namespaces.create(spec);
    },
    delete: function(namespace) {
      return k8s.namespaces.delete(namespace);
    }
  };

  function reload() {
    return k8s.namespaces.list().then(function(namespaces) {
      ret.namespaces = _.sortBy(namespaces, function(ns) {
        return ns.metadata.name;
      });
      ret.loadError = false;
    })
    .catch(function() {
      ret.loadError = true;
    })
    .finally(function() {
      ret.cacheVersion++;
    });
  }

  reload();

  $rootScope.$on(k8s.events.NAMESPACE_DELETED, reloadLater);
  $rootScope.$on(k8s.events.NAMESPACE_ADDED, reloadLater);
  $rootScope.$on(k8s.events.NAMESPACE_MODIFIED, reloadLater);

  return ret;
});
