import {analyticsSvc} from '../../module/analytics';

angular.module('bridge.page')
.factory('ModalLauncherSvc', function($uibModal, _) {
  'use strict';

  var modalConfig = {
    'reactive-modal': {
      templateUrl: '/static/page/modals/reactive-modal.html',
      controller: 'ReactiveModalCtrl',
    },
  };

  return {
    open: function(name, resolve, additionalConfig = {}) {
      _.forEach(resolve, function(value, key) {
        resolve[key] = _.isFunction(value) ? value : function () {return value;};
      });
      const config = _.defaults({}, modalConfig[name], {resolve: resolve}, additionalConfig);
      analyticsSvc.route(config.templateUrl.replace('/static/page', ''));
      const open = $uibModal.open(config);
      open.closed.then(function() {
        analyticsSvc.unsetRoute();
      });
      return open;
    }
  };
});
