angular.module('bridge.page')
.controller('SearchCtrl', function($location) {
  'use strict';

  // Add expected GET parameters if missing
  if($location.search().kind === undefined) {
    $location.search('kind', '');
  }
  if($location.search().q === undefined) {
    $location.search('q', '');
  }
});
