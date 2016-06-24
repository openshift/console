(function () {
  'use strict';

  angular.module('bridge.service')
    .factory('fileSaverSvc', function fileSaverSvc($window) {
      return {
        saveAs: $window.saveAs,
      };
    })
  ;
})();
