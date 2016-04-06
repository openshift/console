angular.module('bridge.ui')
.directive('coNamespaceListMenu', function(namespaceCacheSvc) {
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
      var vm = this;
      vm.namespaceCacheSvc = namespaceCacheSvc;

      $scope.$watch(function() {
        return vm.chosen && vm.namespaceCacheSvc.cacheVersion;
      }, function() {
        if (vm.chosen) {
          vm.chosen = vm.namespaceCacheSvc.get(vm.chosen.metadata.name);
        }
      });

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
