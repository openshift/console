angular.module('bridge.ui')
.directive('coServiceList', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/service-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
      search: '=',
      selector: '=',
      load: '=',
    },
    controller: function(k8s, $scope, Firehose) {
      new Firehose(k8s.services, $scope.namespace, $scope.selector)
        .watchList()
        .bindScope($scope);
    }
  };
});
