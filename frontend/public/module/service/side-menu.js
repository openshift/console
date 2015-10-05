/**
 * Side menu service to manage show / hide state.
 */
angular.module('bridge.service')
.service('sideMenuVisibility', function() {
  'use strict';
  var showSideMenu = false;

  this.getShowSideMenu = function() {
    return showSideMenu;
  };

  this.toggleSideMenu = function() {
    showSideMenu = !showSideMenu;
  };

  this.hideSideMenu = function() {
    showSideMenu = false;
  };
});
