angular.module('bridge.service')
.factory('analyticsSvc', function($window, $rootScope, $location) {
  'use strict';
  // Ensure datalayer for GTM exists
  var dataLayer =  $window.dataLayer = $window.dataLayer || [];

  return {
    error: function(message, route) {
      if (!route) {
        route = $rootScope.modalRoute || $location.path();
      }
      dataLayer.push({
        event: 'tectonicError',
        attributes: {
          message: message,
          route: route
        }
      });
    },
    route: function(route) {
      if (!route) {
        route = $rootScope.modalRoute || $location.path();
      }
      dataLayer.push({
        event: 'tectonicRouteChange',
        attributes: {
          route: route
        }
      });
    },
    push: dataLayer.push.bind(dataLayer)
  };
});
