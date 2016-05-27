/**
 * Helper controller for repeated form rows inputs.
 * Requires `emptyCheck` and `getEmptyItem` to be injected.
 */
angular.module('bridge.page')
.controller('RowMgr', function(_, $scope, emptyCheck, getEmptyItem) {
  'use strict';

  this.items = [];
  this.min = 4;

  this.appendItem = function(item) {
    this.items.push(item);
  };

  this.appendEmptyItem = function() {
    this.appendItem(getEmptyItem());
  };

  this.growIfLast = function(index) {
    if (index === this.items.length - 1) {
      this.appendItem(getEmptyItem());
    }
  };

  this.setItems = function(items) {
    this.items = items;
    ensureMinItems(this);
  };

  this.clearItem = function(item) {
    _.pull(this.items, item);
    ensureMinItems(this);
  };

  this.getNonEmptyItems = function() {
    return _.filter(this.items, _.negate(emptyCheck));
  };

  function ensureMinItems(self) {
    while (self.items.length < self.min) {
      self.appendEmptyItem();
    }
  }
});
