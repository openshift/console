import { EVENTS } from '../../../const';
import { configurePortsModal, configurePrimaryCommandModal, configurePullPolicyModal } from '../../../components/modals';

angular.module('bridge.ui')

/**
 * single-container input directive form.
 */
.directive('coContainerInput', function(_, k8s) {

  'use strict';

  return {
    templateUrl: '/static/module/ui/containers/container-input.html',
    restrict: 'E',
    replace: true,
    scope: {
      // container object to bind to
      container: '=',
      // render with 'remove' icon, default is false
      enableRemove: '@',
    },
    controller: function($scope) {

      function updateImage(image, tag) {
        var t;
        t = tag || $scope.fields.containerTag;
        $scope.container.image = `${image || $scope.fields.containerImage}:${t || 'latest'}`;
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

      $scope.openPortsModal = () => configurePortsModal({
        container: $scope.container
      }).result.then((ports) => {
        $scope.container.ports = ports;
      });

      $scope.openPullPolicyModal = () => configurePullPolicyModal({
        container: $scope.container
      }).result.then((imagePullPolicy) => {
        $scope.container.imagePullPolicy = imagePullPolicy;
      });

      $scope.getPullPolicyLabel = k8s.docker.getPullPolicyLabel;

      $scope.getCommandLabel = function() {
        if (_.isEmpty($scope.container.command)) {
          return 'Default Command';
        }
        return 'Custom Command';
      };

      $scope.openPrimaryCommandModal = () => configurePrimaryCommandModal({
        container: $scope.container
      }).result.then((command) => {
        $scope.container.command = command;
      });

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
