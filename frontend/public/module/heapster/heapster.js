'use strict';

angular.module('heapster', ['lodash'])
.filter('queryNamespace', function() {
  return function(input, scope) {
    if (!scope.namespace || !scope.namespace.metadata) {
      return input;
    }

    return encodeURIComponent(_.split(input, '__NAMESPACE__').join(scope.namespace.metadata.name));
  };
})
.directive('coHeapsterList', function () {
  return {
    templateUrl: '/static/module/ui/resources/heapster.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
    }
  };
});
