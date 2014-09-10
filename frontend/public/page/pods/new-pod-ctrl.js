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

  $scope.container = {
    name: null,
    image: null,
    ports: null,
    env: null,
    volumeMounts: null
  };

  $scope.fields = {
    containerImage: '',
    containerTag: ''
  };

  function updateImage(image, tag) {
    var t, img;
    t = tag || $scope.fields.containerTag;
    img = (image || $scope.fields.containerImage);
    if (!_.isEmpty(t)) {
      img += ':' + t;
    }
    $scope.container.image = img;
  }

  $scope.$watch('fields.containerImage', function(image) {
    if (image) {
      updateImage(image, null);
    }
  });

  $scope.$watch('fields.containerTag', function(tag) {
    if (tag) {
      updateImage(null, tag);
    }
  });

  $scope.$watch('pod.id', function(id) {
    $scope.pod.desiredState.manifest.id = id;
  });

  $scope.openPortsModal = function() {
    ModalLauncherSvc.open('configure-ports', {
      ports: $scope.container.ports
    })
    .result.then(function(result) {
      $scope.container.ports = result;
    });
  };

  $scope.openVolumesModal = function() {
    ModalLauncherSvc.open('configure-volumes', {
      volumes: $scope.pod.desiredState.manifest.volumes
    })
    .result.then(function(result) {
      $scope.pod.desiredState.manifest.volumes = result;
    });
  };

  $scope.openVolumeMountsModal = function() {
    ModalLauncherSvc.open('configure-volume-mounts', {
      volumeMounts: $scope.container.volumeMounts,
      volumes: $scope.pod.desiredState.manifest.volumes
    })
    .result.then(function(result) {
      $scope.container.volumeMounts = result;
    });
  };

  $scope.save = function() {
    $scope.pod.desiredState.manifest.containers.push($scope.container);
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
