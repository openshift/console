angular.module('bridge.filter')
.filter('podsFilter', function() {
  'use strict';

  function queryEmpty(q) {
    if (!q || !q.phase) {
      return true;
    }
    return false;
  }

  function phaseFilter(query, pod) {
    if (pod && pod.status && pod.status.phase === query.phase) {
      return true;
    }
    return false;
  }

  return function(pods, query) {
    if (queryEmpty(query)) {
      return pods;
    }
    return pods.filter(phaseFilter.bind(null, query));
  };

});
