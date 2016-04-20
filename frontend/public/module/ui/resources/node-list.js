/**
 * @fileoverview
 * List nodes in a table-like view.
 */

'use strict';

function hasStatus_ (n, k8s, status) {
  // tri-bool classic - status (ready state) is 'true', 'false', or undefined!! :(
  if (!status) {
    return true;
  }
  status = status === 'true';
  return status === k8s.nodes.isReady(n);
};

function isNamed_ (n, name) {
  name = name || '';
  return -1 !== n.metadata.name.indexOf(name);
};

angular.module('bridge.ui')
.directive('coNodeList', function(k8s) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/node-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namefilter: '=',
      statusFilter: '=filter',
      selector: '=',
      trusted: '=',
      nodes: '=',
      compacted: '=',
    },
    controller: function($scope) {
      $scope.loadError = false;
      $scope.getPodFieldSelector = k8s.pods.fieldSelectors.node;
      $scope.isTrusted = k8s.nodes.isTrusted;
      $scope.isReady = k8s.nodes.isReady;
      $scope.filteredNodes = [];

      const filterNodes = () => {
        $scope.filteredNodes = ($scope.nodes || []).filter((n) => {
          return hasStatus_(n, k8s, $scope.statusFilter) && isNamed_(n, $scope.namefilter);
        })
        .sort((a, b) => {
          return a.metadata.name - b.metadata.name;
        });
      }

      $scope.$watch('statusFilter', filterNodes);
      $scope.$watch('namefilter', filterNodes);
      $scope.$watch('nodes', filterNodes);
    }
  };

});
