angular.module('bridge.ui')
.directive('coNamespaceList', function(_, k8s) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/namespace-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      search: '=',
      selector: '=',
    },
    controller: function($scope, Firehose) {
      new Firehose(k8s.namespaces, null, $scope.selector)
        .watchList()
        .bindScope($scope);
    }
  };
});
