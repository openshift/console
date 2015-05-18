angular.module('bridge.filter')
.filter('nodesFilter', function(k8s) {
  'use strict';

  function queryEmpty(q) {
    if (!q || !q.ready) {
      return true;
    }
    return false;
  }

  function readyFilter(query, node) {
    var queryVal;
    // normalize values
    if (query.ready === 'true') {
      queryVal = true;
    }
    if (query.ready === 'false') {
      queryVal = false;
    }
    return queryVal && k8s.nodes.isReady(node);
  }

  return function(nodes, query) {
    if (queryEmpty(query)) {
      return nodes;
    }
    return nodes.filter(readyFilter.bind(null, query));
  };

});
