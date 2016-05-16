angular.module('bridge.ui')
.directive('coNodeSection', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/node-section.html',
    restrict: 'E',
    replace: true,
    scope: {
      trusted: '=',
    },
    controller: function ($scope, k8s, resourceMgrSvc) {
      $scope.passByRef = {compacted :'true'};

      if ($scope.trusted) {
        $scope.title = 'Trusted Nodes';
        $scope.description = 'Nodes that match a known, trusted hardware provider.';
      } else {
        $scope.title = 'Untrusted Nodes';
        $scope.description = 'Nodes that don\'t match a trusted profile or configuration have been modified since being trusted.';
      }

      const loadNodes = () => {
        const query = {};

        k8s.nodes.list(query)
          .then((nodes) => {
            // we do this here because nodes are segregated by trusted type
            $scope.nodes = (nodes || []).filter((n) => {
              return (!!$scope.trusted) === k8s.nodes.isTrusted(n);
            });
            $scope.loadError = false;
          })
          .catch(() => {
            $scope.nodes = [];
            $scope.loadError = true;
          });
      }

      $scope.$on(k8s.events.NODE_DELETED, (e, data) => {
        resourceMgrSvc.removeFromList($scope.nodes, data.resource);
      });

      $scope.$on(k8s.events.NODE_ADDED, loadNodes);

      $scope.$on(k8s.events.NODE_MODIFIED, (e, data) => {
        resourceMgrSvc.updateInList($scope.nodes, data.resource);
      });

      loadNodes();
    }
  };
});
