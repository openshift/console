angular.module('creme.page')
.controller('GeneralErrorCtrl', function($location, messageSvc) {
  'use strict';

  var q = $location.search();
  var type = q.error_type;
  if (!type) {
    this.message = '';
  } else {
    this.message = messageSvc.get(type, q.error || 'default');
  }

});
