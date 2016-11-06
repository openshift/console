import {EVENTS} from '../../../const';

angular.module('bridge.ui')

/**
 * single-container input directive form.
 */
.directive('coContainerInput', function(_, ModalLauncherSvc, k8s) {

  'use strict';

  return {
    templateUrl: '/static/module/ui/containers/container-input.html',
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
        var tagColonIdx;
        if (!image) {
          $scope.fields = getEmptyFields();
          return;
        }
        tagColonIdx = image.lastIndexOf(':');
        if (tagColonIdx >= 0) {
          $scope.fields.containerImage = image.slice(0, tagColonIdx);

          if (tagColonIdx < image.length) {
            $scope.fields.containerTag = image.slice(tagColonIdx + 1);
          } else {
            $scope.fields.containerTag = 'latest';
          }
        } else {
          $scope.fields.containerImage = image;
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

      $scope.getLivenessProbeLabel = function() {
        var label = k8s.probe.getActionLabelFromObject($scope.container.livenessProbe);
        if (!label) {
          label = 'Not Configured';
        }
        return label;
      };

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
