/**
 * Helper controller for repeated form rows inputs.
 * Requires `emptyCheck` and `getEmptyItem` to be injected.
 */
angular.module('app')
.controller('RowMgr', function(_, $scope, arraySvc, emptyCheck, getEmptyItem) {
  'use strict';

  this.items = [];
  this.min = 4;

  this.appendItem = function(item) {
    this.items.push(item);
  };

  this.growIfLast = function(index) {
    if (index === this.items.length - 1) {
      this.appendItem(getEmptyItem());
    }
  };

  this.setItems = function(items) {
    this.items = items;
    while (this.items.length < this.min) {
      this.appendItem(getEmptyItem());
    }
  };

  this.clearItem = function(item) {
    arraySvc.remove(this.items, item);
    if (this.items.length < this.min) {
      this.appendItem(getEmptyItem());
    }
  };

  this.getNonEmptyItems = function() {
    return _.filter(this.items, function(i) {
      return !emptyCheck(i);
    });
  };

});
