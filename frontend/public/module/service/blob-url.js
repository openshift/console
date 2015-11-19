angular.module('bridge.service')
.factory('blobURLSvc', function($window) {
  'use strict';
  return {
    blobURL: function(content, options) {
      var blob = new Blob(content, options);
      return $window.URL.createObjectURL(blob);
    }
  };
});
