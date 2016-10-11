import {analyticsSvc} from '../../module/analytics';

angular.module('bridge.page')
.factory('ModalLauncherSvc', function($uibModal, _) {
  'use strict';

  var modalConfig = {
    'service-ports': {
      templateUrl: '/static/page/modals/service-ports.html',
      controller: 'ServicePortsCtrl',
    },
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
    'configure-liveness': {
      templateUrl: '/static/page/modals/configure-liveness.html',
      controller: 'ConfigureLivenessCtrl',
    },
    'configure-lifecycle': {
      templateUrl: '/static/page/modals/configure-lifecycle.html',
      controller: 'ConfigureLifecycleCtrl',
    },
    'configure-restart-policy': {
      templateUrl: '/static/page/modals/configure-restart-policy.html',
      controller: 'ConfigureRestartPolicyCtrl',
    },
    'configure-primary-command': {
      templateUrl: '/static/page/modals/configure-primary-command.html',
      controller: 'ConfigurePrimaryCommandCtrl',
    },
    'configure-resource-limits': {
      templateUrl: '/static/page/modals/configure-resource-limits.html',
      controller: 'ConfigureResourceLimitsCtrl',
    },
    'confirm': {
      templateUrl: '/static/page/modals/confirm.html',
      controller: 'ModalConfirmCtrl',
    },
    'configure-replica-count': {
      templateUrl: '/static/page/modals/configure-replica-count.html',
      controller: 'ConfigureReplicaCountCtrl',
    },
    'configure-job-parallelism': {
      templateUrl: '/static/page/modals/configure-job-parallelism.html',
      controller: 'ConfigureJobParallelismCtrl',
    },
    'configure-hpa-replicas': {
      templateUrl: '/static/page/modals/configure-hpa-replicas.html',
      controller: 'ConfigureHpaReplicasCtrl',
    },
    'configure-hpa-targets': {
      templateUrl: '/static/page/modals/configure-hpa-targets.html',
      controller: 'ConfigureHpaTargetsCtrl',
    },
    'new-namespace': {
      templateUrl: '/static/page/modals/new-namespace.html',
      controller: 'NewNamespaceCtrl',
      size: 'dialog--std-width',
    },
    'new-user': {
      templateUrl: '/static/page/modals/new-user.html',
      controller: 'NewUserCtrl',
      size: 'dialog--std-width',
    },
    'new-user-invite-link': {
      templateUrl: '/static/page/modals/new-user-invite-link.html',
      controller: 'NewUserInviteLinkCtrl',
      size: 'dialog--std-width',
    },
    'toggle-disabled-user': {
      templateUrl: '/static/page/modals/toggle-disabled-user.html',
      controller: 'ToggleDisabledUserCtrl',
    },
    'show-yaml': {
      templateUrl: '/static/page/modals/show-yaml.html',
      controller: 'ShowYAMLCtrl',
    },
    'dtc-settings': {
      templateUrl: '/static/page/modals/dtc-settings.html',
      controller: 'DtcSettingsCtrl',
    },
    'namespace-quay-pull-secret': {
      templateUrl: '/static/page/modals/namespace-quay-pull-secret/namespace-quay-pull-secret.html',
      controller: 'NamespaceQuayPullSecretCtrl',
    },
    'kubectl-config': {
      templateUrl: '/static/page/modals/kubectl-config/kubectl-config.html',
      controller: 'KubectlConfigCtrl',
    },
    'revoke-refresh-token': {
      templateUrl: '/static/page/modals/revoke-refresh-token.html',
      controller: 'RevokeRefreshTokenCtrl',
    },
    'reactive-modal': {
      templateUrl: '/static/page/modals/reactive-modal.html',
      controller: 'ReactiveModalCtrl',
    },
  };

  return {
    open: function(name, resolve) {
      var config = modalConfig[name];
      _.forEach(resolve, function(value, key) {
        resolve[key] = _.isFunction(value) ? value : function () {return value;};
      });
      config.resolve = resolve;
      analyticsSvc.route(config.templateUrl.replace('/static/page', ''));
      var open = $uibModal.open(config);
      open.closed.then(function() {
        analyticsSvc.unsetRoute();
      });
      return open;
    }
  };
});
