angular.module('app')
.controller('ConfigurePortCtrl', function(_, $scope, $rootScope, $controller,
      $modalInstance, k8s, kind, resource, propertyName, title, description) {
  'use strict';

  $scope.title = title || 'Modify Port';
  $scope.description = description;
  $scope.fields = {
    port: resource.spec[propertyName],
  };

  $scope.save = function() {
    var rsc = angular.copy(resource);
    rsc.spec[propertyName] = $scope.fields.port;
    $scope.requestPromise = k8s.resource.update(kind, rsc);
    $scope.requestPromise.then(function(updatedResource) {
      $modalInstance.close(updatedResource);
    });
  };

  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

})
.controller('ConfigurePortFormCtrl', function($scope) {
  'use strict';
  $scope.submit = $scope.save;
});
