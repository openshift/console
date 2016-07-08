'use strict';

const TEMPLATE = `
<div id="co-namespace-selector" >
  Namespace:
  <co-dropdown title="'all'" items="items" selected="passByRef.namespace" nobutton="true" class="co-namespace-selector__dropdown">
  </co-dropdown>

  <div ng-if="canLogin" class="pull-right" ng-click="logout()" id="logout">
    logout
  </div>
</div>
`;

angular.module('bridge.ui')
.directive('coNamespaceSelector', function (k8sCache, activeNamespaceSvc, authSvc, featuresSvc) {
  return {
    template: TEMPLATE,
    restrict: 'E',
    replace: true,
    controller: function ($scope) {
      $scope.passByRef = {namespace: ''};

      $scope.canLogin = !featuresSvc.isAuthDisabled
      $scope.logout = e => {
        if ($scope.canLogin) {
          authSvc.logout();
        }
        e.preventDefault();
      };

      $scope.$watch('passByRef', selected => {
        const namespace = selected && selected.namespace;
        activeNamespaceSvc.setActiveNamespace(namespace);
      }, true);

      k8sCache.namespacesChanged($scope,
        namespaces => {
          $scope.loadError = false;

          const items = {all: ''};
          namespaces.map(n => {
            const name = n.metadata.name;
            items[name] = name;
          });
          $scope.items = items;
        }, () => {
          $scope.loadError = true
        }
      );
    }
  };
});
