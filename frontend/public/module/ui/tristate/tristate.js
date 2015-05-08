/**
 * @fileoverview
 *
 * A directive to indicate if a collection of resources has loaded, is empty,
 * or has errored while loading.
 */

angular.module('bridge.ui')
.directive('cosTristate', function() {
  'use strict';

  var cssClassPrefix = 'cos-tristate',
      states = ['empty', 'error', 'loading'];

  return {
    template: '<div ng-cloak ng-transclude></div>',
    transclude: true,
    restrict: 'EA',
    replace: true,
    scope: {
      'collection': '=cosTristate',
      'errorFlag': '=cosTristateError'
    },
    controller: function($scope) {
      this.isEmpty = function() {
        return $scope.collection && !$scope.collection.length;
      };

      this.isError = function() {
        return $scope.errorFlag;
      };

      this.isLoading = function() {
        return !this.isError() && !$scope.collection;
      }.bind(this);

      this.getState = function() {
        if (this.isError()) {
          return 'error';
        }
        if (this.isEmpty()) {
          return 'empty';
        }
        if (this.isLoading()) {
          return 'loading';
        }
      }.bind(this);
    },
    link: function(scope, elem, attrs, loadStateCtrl) {
      function reset() {
        states.forEach(function(s) {
          elem.removeClass(cssClassPrefix + '--' + s);
        });
      }

      function updateState(state) {
        reset();
        if (state) {
          elem.addClass(cssClassPrefix + '--' + state);
        }
      }

      scope.$watch(loadStateCtrl.getState, updateState);
    },
  };

});
