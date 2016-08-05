'use strict';

const TEMPLATE = `
<div id="co-namespace-selector" >
  Namespace:
  <co-dropdown title="title" selected="activeNamespace" items="availableNamespaces" nobutton="true" class="co-namespace-selector__dropdown">
  </co-dropdown>

  <div ng-if="canLogin" class="pull-right" ng-click="logout()" id="logout">
    logout
  </div>
</div>
`;

angular.module('bridge.ui')
.directive('coNamespaceSelector', function (activeNamespaceSvc, authSvc, featuresSvc, Firehose, k8s) {
  return {
    template: TEMPLATE,
    restrict: 'E',
    replace: true,
    controller: function ($scope) {
      $scope.activeNamespace     = activeNamespaceSvc.getActiveNamespace();
      $scope.title               = coerceTitle($scope.activeNamespace);
      $scope.availableNamespaces = coerceNamespaces();
      $scope.canLogin            = !featuresSvc.isAuthDisabled

      $scope.logout = e => {
        if ($scope.canLogin) {
          authSvc.logout();
        }
        e.preventDefault();
      };

      $scope.$watch('activeNamespace', activeNamespace => {
        activeNamespaceSvc.setActiveNamespace(activeNamespace);
        $scope.title = coerceTitle(activeNamespace);
      });

      new Firehose(k8s.namespaces)
        .watchList()
        .bindScope($scope, null, state => {
          $scope.availableNamespaces = coerceNamespaces(state && state.namespaces);
          $scope.loadError           = state.loadError;
        })
      ;

      function coerceTitle(namespace) {
        return namespace || 'all';
      }

      function coerceNamespaces(namespaces) {
        const coersedNamespaces = {all: undefined};

        // make sure active namespace is always available
        // until we finally get actual data from service
        if ($scope.activeNamespace) {
          coersedNamespaces[$scope.activeNamespace] = $scope.activeNamespace;
        }

        (namespaces || []).forEach(n => {
          const {name} = n.metadata;
          coersedNamespaces[name] = name;
        });

        return coersedNamespaces;
      }
    }
  };
});
