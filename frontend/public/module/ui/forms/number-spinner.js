/**
 * @fileoverview
 * Number spinner UI component.
 */

angular.module('bridge.ui')
.directive('coNumberSpinner', function($) {
  'use strict';

  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var downEl, upEl;

      // Must update the model directly in the context of a $scope.apply()
      // for changes to take effect.
      function setValue(val) {
        scope.$apply(`${attrs.ngModel} = ${val}`);
      }

      function getValue() {
        return parseInt(elem.val(), 10);
      }

      elem.addClass('co-m-number-spinner__input');
      downEl = $('<i class="fa fa-minus-square co-m-number-spinner__down-icon"></i>');
      upEl = $('<i class="fa fa-plus-square co-m-number-spinner__up-icon"></i>');
      elem.before(downEl);
      elem.after(upEl);

      downEl.on('click', function() {
        setValue(getValue() - 1);
      });

      upEl.on('click', function() {
        setValue(getValue() + 1);
      });

      elem.on('$destroy', function() {
        upEl.off();
        downEl.off();
      });

    }
  };

});
