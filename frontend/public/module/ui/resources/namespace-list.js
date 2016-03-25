angular.module('bridge.ui')
.factory('namespaceListController', function(_, k8s, resourceMgrSvc) {
  return function($scope, $attrs) {
    var vm = this;
    vm.namespaces = null;
    vm.loadError = false;

    function loadNamespaces() {
      var query = {};
      if ($attrs.selectorRequired && _.isEmpty($scope.selector)) {
        vm.namespaces = [];
        return;
      }

      if (!_.isEmpty($scope.selector)) {
        query.labelSelector = $scope.selector;
      }

      k8s.namespaces.list(query)
        .then(function(namespaces) {
          vm.namespaces = namespaces;
        });
    }

    // TODO these events could be ancient. How do other resources ensure they don't waste their time?
    $scope.$on(k8s.events.NAMESPACE_DELETED, function(e, data) {
      resourceMgrSvc.removeFromList(vm.namespaces, data.resource);
    });

    $scope.$on(k8s.events.NAMESPACE_ADDED, _.debounce(loadNamespaces, 250));

    $scope.$on(k8s.events.NAMESPACE_MODIFIED, function(e, data) {
      resourceMgrSvc.updateInList(vm.namespaces, data.resource);
    });

    loadNamespaces();
  };
})
.directive('coNamespaceList', function(namespaceListController) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/namespace-list.html',
    restrict: 'E',
    replace: true,
    controllerAs: 'vm',
    scope: {
      search: '=',
      selector: '=',
    },
    controller: namespaceListController
  };
})
.directive('coNamespaceListMenu', function(namespaceListController) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/namespace-list-menu.html',
    restrict: 'E',
    replace: true,
    controllerAs: 'vm',
    scope: {
      search: '=',
      chosen: '=',
    },
    controller: function($scope, $attrs) {
      namespaceListController.call(this, $scope, $attrs);

      // controllerAs is a workaround to deal with isolated scopes
      // inside of ng-repeat, but that means we have to keep the scope
      // synchronized by hand.
      $scope.$watch('chosen', function() {
        $scope.vm.chosen = $scope.chosen;
      });
      $scope.$watch('vm.chosen', function() {
        $scope.chosen = $scope.vm.chosen;
      });
    }
  }
});
