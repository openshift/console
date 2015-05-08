/**
 * @fileoverview
 * Generic label input field.
 */

angular.module('bridge.ui')
.directive('coLabelInput', function(_, $timeout) {
  'use strict';

  function objectify(arr) {
    var result = {};
    if (!arr) {
      return result;
    }
    _.each(arr, function(item) {
      var parts = item.text.split('=');
      result[parts[0]] = parts[1];
    });
    return result;
  }

  function arrayify(obj) {
    var result = [];
    _.each(obj, function(v, k) {
      result.push({
        text: k + '=' + v
      });
    });
    return result;
  }

  return {
    templateUrl: '/static/module/ui/labels/label-input.html',
    restrict: 'E',
    replace: true,
    scope: {
      // model to bind input to
      labels: '=ngModel',
      // k8s kind enum id: 'service', 'pod', 'replicationcontroller'
      kind: '@',
      // 'true', 'false' (default)
      selector: '@',
      // Optionally auto-focus after render.
      autofocus: '@',
    },
    controller: function($scope, $attrs) {
      if ($scope.kind) {
        $scope.cssClass = 'co-m-label-input--' + $scope.kind;
      }

      $attrs.$observe('kind', function(newVal) {
        $attrs.$removeClass('co-m-label-input--service co-m-label-input--controller co-m-label-input--pod');
        $attrs.$addClass('co-m-label-input--' + newVal);
      });

      $scope.$watchCollection('labels', function(labels) {
        $scope.arrModel = arrayify(labels);
      });

      $scope.$watchCollection('arrModel', function(arr) {
        $scope.labels = objectify(arr);
      });
    },
    link: function(scope, elem, attrs) {
      if (attrs.autofocus === 'true') {
        $timeout(function() {
          elem.find('input').focus();
        }, 20, false);
      }
    },
  };

});
