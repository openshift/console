import i18n from '@console/internal/i18n';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Resources } from '../../../import/import-types';

export enum DeploymentStrategyType {
  recreateParams = 'Recreate',
  rollingParams = 'Rolling',
  customParams = 'Custom',
  rollingUpdate = 'RollingUpdate',
}

export const getKubernetesDeploymentStrategyOptions = () => ({
  [DeploymentStrategyType.recreateParams]: i18n.t('devconsole~Recreate'),
  [DeploymentStrategyType.rollingUpdate]: i18n.t('devconsole~Rolling Update'),
});

export const getOpenshiftDeploymentStrategyOptions = () => ({
  [DeploymentStrategyType.recreateParams]: i18n.t('devconsole~Recreate'),
  [DeploymentStrategyType.rollingParams]: i18n.t('devconsole~Rolling'),
  [DeploymentStrategyType.customParams]: i18n.t('devconsole~Custom'),
});

export const getKubernetesDeploymentStrategyHelpText = () => ({
  [DeploymentStrategyType.recreateParams]: i18n.t(
    'devconsole~The recreate strategy has basic rollout behavior.',
  ),
  [DeploymentStrategyType.rollingUpdate]: i18n.t(
    'devconsole~The rolling strategy will wait for pods to pass their readiness check, scale down old components and then scale up.',
  ),
});

export const getOpenshiftDeploymentStrategyHelpText = () => ({
  [DeploymentStrategyType.recreateParams]: i18n.t(
    'devconsole~The recreate strategy has basic rollout behavior and supports lifecycle hooks for injecting code into the deployment process.',
  ),
  [DeploymentStrategyType.rollingParams]: i18n.t(
    'devconsole~The rolling strategy will wait for pods to pass their readiness check, scale down old components and then scale up.',
  ),
  [DeploymentStrategyType.customParams]: i18n.t(
    'devconsole~The custom strategy allows you to specify container image that will provide your own deployment behavior.',
  ),
});

export const getDeploymentStrategyDropdownData = () => ({
  [Resources.Kubernetes]: {
    items: getKubernetesDeploymentStrategyOptions(),
    helpText: getKubernetesDeploymentStrategyHelpText(),
  },
  [Resources.OpenShift]: {
    items: getOpenshiftDeploymentStrategyOptions(),
    helpText: getOpenshiftDeploymentStrategyHelpText(),
  },
});

export type StrategyFieldProps = {
  resourceType?: string;
  resourceObj: K8sResourceKind;
};

export enum LifecycleAction {
  execNewPod = 'execNewPod',
  tagImages = 'tagImages',
}

export enum FailurePolicyType {
  Abort = 'Abort',
  Retry = 'Retry',
  Ignore = 'Ignore',
}

export const getFailurePolicyOptions = () => ({
  [FailurePolicyType.Abort]: i18n.t('devconsole~Abort'),
  [FailurePolicyType.Retry]: i18n.t('devconsole~Retry'),
  [FailurePolicyType.Ignore]: i18n.t('devconsole~Ignore'),
});
