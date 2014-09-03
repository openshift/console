/**
 * @fileoverview
 * Generic label input field.
 */

angular.module('app').directive('coLabelInput', function(_) {
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
    templateUrl: '/static/module/label/label-input.html',
    restrict: 'E',
    replace: true,
    scope: {
      // model to bind input to
      labels: '=ngModel',
      // 'service', 'pod', 'controller'
      type: '@',
      // 'true', 'false' (default)
      selector: '@',
    },
    controller: function($scope) {
      $scope.arrModel = arrayify($scope.labels);

      if ($scope.type) {
        $scope.cssClass = 'co-m-label-input--' + $scope.type;
      }

      $scope.$watchCollection('arrModel', function(arr) {
        $scope.labels = objectify(arr);
      });

    }
  };

});
