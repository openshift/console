/**
 * @fileoverview
 * List services in a table-like view.
 */

angular.module('app.ui')
.directive('coServiceList', function(k8s, _, arraySvc, resourceMgrSvc) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/service-list.html',
    restrict: 'E',
    replace: true,
    scope: {
      services: '='
    },
    controller: function($scope) {

      $scope.getPods = function(svc) {
        k8s.pods.list({ns: svc.metadata.namespace, labels: svc.spec.selector })
          .then(function(pods) {
            svc.pods = pods;
          });
      };

      $scope.$on(k8s.events.RESOURCE_DELETED, function(e, data) {
        if (data.kind === k8s.enum.Kind.SERVICE) {
          arraySvc.remove($scope.services, data.original);
        }
      });

      // Remove old service and add new version on update.
      $scope.$on(k8s.events.RESOURCE_UPDATED, function(e, data) {
        if (data.kind === k8s.enum.Kind.SERVICE) {
          resourceMgrSvc.updateInList($scope.services, data.resource);
        }
      });

    }
  };

});
