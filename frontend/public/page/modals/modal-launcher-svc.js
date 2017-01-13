import {analyticsSvc} from '../../module/analytics';

angular.module('bridge.page')
.factory('ModalLauncherSvc', function($uibModal, _) {
  'use strict';

  var modalConfig = {
    'service-ports': {
      templateUrl: '/static/page/modals/service-ports.html',
      controller: 'ServicePortsCtrl',
    },
    'configure-update-strategy': {
      templateUrl: '/static/page/modals/configure-update-strategy.html',
      controller: 'ConfigureUpdateStrategyCtrl',
    },
    'configure-revision-history-limit': {
      templateUrl: '/static/page/modals/configure-revision-history-limit.html',
      controller: 'ConfigureRevisionHistoryLimitCtrl',
    },
    'configure-labels': {
      templateUrl: '/static/page/modals/configure-labels.html',
      controller: 'ConfigureLabelsCtrl',
    },
    'configure-selector': {
      templateUrl: '/static/page/modals/configure-selector.html',
      controller: 'ConfigureSelectorCtrl',
    },
    'configure-pull-policy': {
      templateUrl: '/static/page/modals/configure-pull-policy.html',
      controller: 'ConfigurePullPolicyCtrl',
    },
    'configure-primary-command': {
      templateUrl: '/static/page/modals/configure-primary-command.html',
      controller: 'ConfigurePrimaryCommandCtrl',
    },
    'configure-hpa-replicas': {
      templateUrl: '/static/page/modals/configure-hpa-replicas.html',
      controller: 'ConfigureHpaReplicasCtrl',
    },
    'configure-hpa-targets': {
      templateUrl: '/static/page/modals/configure-hpa-targets.html',
      controller: 'ConfigureHpaTargetsCtrl',
    },
    'namespace-pull-secret': {
      templateUrl: '/static/page/modals/namespace-pull-secret/namespace-pull-secret.html',
      controller: 'NamespacePullSecretCtrl',
    },
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
