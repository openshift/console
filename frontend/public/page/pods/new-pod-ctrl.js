angular.module('app')
.controller('NewPodCtrl', function(_, $scope, $location, $routeParams, PodsSvc,
      ModalLauncherSvc) {

  'use strict';

  $scope.pod = {
    id: null,
    labels: null,

    desiredState: {
      manifest: {
        version: 'v1beta1',
        id: null,
        containers: [],
        volumes: null
      }
    },
  };

  $scope.$watch('pod.id', function(id) {
    $scope.pod.desiredState.manifest.id = id;
  });

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      volumes: $scope.pod.desiredState.manifest.volumes
    })
    .result.then(function(result) {
      $scope.pod.desiredState.manifest.volumes = result;
    });
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
