angular.module('app')
.factory('ModalLauncherSvc', function($modal, _, d3) {
  'use strict';

  var modalConfig = {
    'configure-ports': {
      templateUrl: '/static/page/modals/configure-ports.html',
      controller: 'ConfigurePortsCtrl',
    },
  };

  return {
    open: function(name, resolve) {
      var config = modalConfig[name];
      _.each(resolve, function(value, key) {
        if (!_.isFunction(value)) {
          resolve[key] = d3.functor(value);
        }
      });
      config.resolve = resolve;
      return $modal.open(config);
    }
  };

});
