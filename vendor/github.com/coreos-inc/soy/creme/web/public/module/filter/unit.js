angular.module('creme.filter').filter('unit', function(UNIT_DISPLAY) {
  'use strict';

  return function(unitOfMeasure, qty) {
    var conversion, result = '';
    if (!unitOfMeasure || !unitOfMeasure.name) {
      return '';
    }
    conversion = UNIT_DISPLAY[unitOfMeasure.name];
    if (!conversion) {
      return qty + ' ' + unitOfMeasure.displayedAs;
    }

    if (!conversion.omitQuantity) {
      result = qty + ' ';
    }
    result += (conversion.label || unitOfMeasure.displayedAs);
    return result;
  };

});
