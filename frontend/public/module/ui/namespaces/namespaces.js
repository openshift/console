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
.directive('coNamespaceSelector', function (activeNamespaceSvc, authSvc, featuresSvc, Firehose, k8s) {
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

      const namespaces = k8s.namespaces;
      new Firehose(namespaces)
        .watchList()
        .bindScope($scope, null, state => {
          const items = {all: ''};
          state.namespaces && state.namespaces.forEach(n => {
            const {name} = n.metadata;
            items[name] = name;
          });
          $scope.items = items;
          $scope.loadError = state.loadError;
        });

    }
  };
});
