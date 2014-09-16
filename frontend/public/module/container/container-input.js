angular.module('app')

/**
 * multi-container input directive form.
 */
.directive('coMultiContainerInput', function(_, arraySvc, PodsSvc, EVENTS) {

  'use strict';

  return {
    templateUrl: '/static/module/container/multi-container-input.html',
    restrict: 'E',
    replace: true,
    scope: {
      pod: '='
    },
    controller: function($scope) {

      $scope.init = function() {
        if (_.isEmpty($scope.pod.desiredState.manifest.containers)) {
          $scope.pod.desiredState.manifest.containers = [PodsSvc.getEmptyContainer()];
        }
        // shorter alias
        $scope.containers = $scope.pod.desiredState.manifest.containers;
        $scope.$on(EVENTS.CONTAINER_REMOVE, function(e, container) {
          $scope.removeContainer(container);
          e.stopPropagation();
        });
      };

      $scope.removeContainer = function(c) {
        if ($scope.containers.length === 1) {
          $scope.containers = [PodsSvc.getEmptyContainer()];
        } else {
          arraySvc.remove($scope.containers, c);
        }
      };

      $scope.addContainer = function() {
        $scope.containers.push(PodsSvc.getEmptyContainer());
      };

      $scope.init();

    }
  };

})
/**
 * single-container input directive form.
 */
.directive('coContainerInput', function(_, ModalLauncherSvc, EVENTS) {

  'use strict';

  return {
    templateUrl: '/static/module/container/container-input.html',
    restrict: 'E',
    replace: true,
    scope: {
      // container object to bind to
      container: '=',
      // pod volumes to use for container volume mount selection
      podVolumes: '=',
      // render with 'remove' icon, default is false
      enableRemove: '@',
    },
    controller: function($scope) {

      function updateImage(image, tag) {
        var t, img;
        t = tag || $scope.fields.containerTag;
        img = (image || $scope.fields.containerImage);
        if (!_.isEmpty(t)) {
          img += ':' + t;
        }
        $scope.container.image = img;
      }

      $scope.fields = {
        containerImage: '',
        containerTag: '',
      };

      $scope.openPortsModal = function() {
        ModalLauncherSvc.open('configure-ports', {
          container: $scope.container
        });
      };

      $scope.openEnvModal = function() {
        ModalLauncherSvc.open('configure-env', {
          container: $scope.container
        });
      };

      $scope.openVolumeMountsModal = function() {
        ModalLauncherSvc.open('configure-volume-mounts', {
          container: $scope.container,
          volumes: $scope.podVolumes
        });
      };

      $scope.remove = function() {
        $scope.$emit(EVENTS.CONTAINER_REMOVE, $scope.container);
      };

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

    }
  };

});
