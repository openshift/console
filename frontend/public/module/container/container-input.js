angular.module('app')

/**
 * multi-container input directive form.
 */
.directive('coMultiContainerInput', function(_, arraySvc, k8s, EVENTS) {

  'use strict';

  return {
    templateUrl: '/static/module/container/multi-container-input.html',
    restrict: 'E',
    replace: true,
    scope: {
      pod: '='
    },
    controller: function($scope) {

      $scope.$on(EVENTS.CONTAINER_REMOVE, function(e, container) {
        $scope.removeContainer(container);
        e.stopPropagation();
      });

      $scope.removeContainer = function(c) {
        if ($scope.containers.length === 1) {
          $scope.containers = [k8s.docker.getEmptyContainer()];
        } else {
          arraySvc.remove($scope.containers, c);
        }
      };

      $scope.addContainer = function() {
        $scope.containers.push(k8s.docker.getEmptyContainer());
      };

      $scope.$watch('pod', function(p) {
        if (!p || !p.spec) {
          return;
        }
        if (_.isEmpty(p.spec.containers)) {
          p.spec.containers = [k8s.docker.getEmptyContainer()];
        }
        // shorter alias
        $scope.containers = p.spec.containers;
      });
    }
  };

})
/**
 * single-container input directive form.
 */
.directive('coContainerInput', function(_, ModalLauncherSvc, k8s, EVENTS) {

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
        var t;
        t = tag || $scope.fields.containerTag;
        $scope.container.image = (image || $scope.fields.containerImage) + ':' + (t || 'latest');
      }

      function getEmptyFields() {
        return {
          containerImage: '',
          containerTag: 'latest',
        };
      }

      function updateImageFields(image) {
        var parts;
        if (!image) {
          $scope.fields = getEmptyFields();
          return;
        }
        parts = image.split(':');
        if (parts.length > 0) {
          $scope.fields.containerImage = parts[0];
        }
        if (parts.length > 1) {
          $scope.fields.containerTag = parts[1];
        } else {
          $scope.fields.containerTag = 'latest';
        }
      }

      $scope.fields = getEmptyFields();

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

      $scope.openPullPolicyModal = function() {
        ModalLauncherSvc.open('configure-pull-policy', {
          container: $scope.container
        });
      };

      $scope.getPullPolicyLabel = k8s.docker.getPullPolicyLabel;

      $scope.openLivenessModal = function() {
        ModalLauncherSvc.open('configure-liveness', {
          container: $scope.container
        });
      };

      $scope.getLifecycleLabel = function() {
        if (_.isEmpty($scope.container.lifecycle)) {
          return 'Not Configured';
        }
        return 'Configured';
      };

      $scope.openLifecycleModal = function() {
        ModalLauncherSvc.open('configure-lifecycle', {
          container: $scope.container
        });
      };

      $scope.getCommandLabel = function() {
        if (_.isEmpty($scope.container.command)) {
          return 'Default Command';
        }
        return 'Custom Command';
      };

      $scope.openPrimaryCommandModal = function() {
        ModalLauncherSvc.open('configure-primary-command', {
          container: $scope.container
        });
      };

      $scope.openResourceLimitsModal = function() {
        ModalLauncherSvc.open('configure-resource-limits', {
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

      $scope.$watch('container.image', updateImageFields);

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
