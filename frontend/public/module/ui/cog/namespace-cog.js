angular.module('bridge.ui')
.directive('coNamespaceCog', function(k8s, ModalLauncherSvc, namespacesSvc) {
  'use strict';

  return {
    template:
      '<div class="co-m-cog-wrapper">' +
        '<co-cog options="cogOptions" size="small" anchor="{{anchor || \'left\'}}"></co-cog>' +
      '</div>',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      anchor: '@',
    },
    controller: function($scope) {
      function getDeleteFn() {
        return function() {
          return k8s.namespaces.delete($scope.namespace);
        }
      };

      $scope.cogOptions = [
        {
          label: 'Enter Namespace',
          weight: 100,
          callback: function() {
            namespacesSvc.setActiveNamespace($scope.namespace.metadata.name);
          }
        },
        {
          label: 'Delete Namespace...',
          weight: 300,
          callback: ModalLauncherSvc.open.bind(null, 'confirm', {
            title: 'Delete Namespace',
            message: 'Are you sure you want to delete ' +
              $scope.namespace.metadata.name + '? ' +
              'This will destroy all pods, services, and other objects in the deleted namespace!',
            btnText: 'Delete Namespace',
            executeFn: getDeleteFn
          }),
        }
      ];

      if ($scope.namespace.metadata.name === 'default') {
        $scope.cogOptions.pop();
      }
    }
  };
});
