import {EVENTS} from '../../../const';

angular.module('bridge.ui')

/**
 * multi-container input directive form.
 */
.directive('coMultiContainerInput', function(_, arraySvc, k8s) {

  'use strict';

  return {
    templateUrl: '/static/module/ui/containers/multi-container-input.html',
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

});
