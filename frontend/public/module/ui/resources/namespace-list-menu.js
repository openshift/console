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
    controller: function($scope) {
      var vm = this;
      vm.namespaceCacheSvc = namespaceCacheSvc;

      $scope.$watch('vm.chosen', function() {
        $scope.chosen = $scope.vm.chosen;
      });
    }
  };
});
