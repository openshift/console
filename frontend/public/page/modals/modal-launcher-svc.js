angular.module('app')
.factory('ModalLauncherSvc', function($modal, _, d3) {
  'use strict';

  var modalConfig = {
    'configure-ports': {
      templateUrl: '/static/page/modals/configure-ports.html',
      controller: 'ConfigurePortsCtrl',
    },
    'configure-volumes': {
      templateUrl: '/static/page/modals/configure-volumes.html',
      controller: 'ConfigureVolumesCtrl',
    },
    'configure-volume-mounts': {
      templateUrl: '/static/page/modals/configure-volume-mounts.html',
      controller: 'ConfigureVolumeMountsCtrl',
    },
    'configure-env': {
      templateUrl: '/static/page/modals/configure-env.html',
      controller: 'ConfigureEnvCtrl',
    },
    'configure-pull-policy': {
      templateUrl: '/static/page/modals/configure-pull-policy.html',
      controller: 'ConfigurePullPolicyCtrl',
    },
    'confirm': {
      templateUrl: '/static/page/modals/confirm.html',
      controller: 'ModalConfirmCtrl',
    },
    'view-json': {
      templateUrl: '/static/page/modals/view-json.html',
      controller: 'ViewJsonCtrl',
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
