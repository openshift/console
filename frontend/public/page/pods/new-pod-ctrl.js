angular.module('app')
.controller('NewPodCtrl', function(_, $scope, $location, $routeParams, PodsSvc,
      ModalLauncherSvc) {

  'use strict';

  $scope.pod = PodsSvc.getEmptyPod();

  $scope.$watch('pod.id', function(id) {
    $scope.pod.desiredState.manifest.id = id;
  });

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      pod: $scope.pod
    });
  };

  $scope.cancel = function() {
    $location.path('/pods');
  };

  $scope.save = function() {
    $scope.requestPromise = PodsSvc.create($scope.pod);
    $scope.requestPromise.then(function() {
      $location.path('/pods');
    });
  };

})

.controller('NewPodFormCtrl', function($scope) {
  'use strict';

  $scope.submit = $scope.save;
});
