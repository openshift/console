import { K8sResourceKind } from '@console/internal/module/k8s';
import { Resources } from '../../../import/import-types';

export enum DeploymentStrategyType {
  recreateParams = 'Recreate',
  rollingParams = 'Rolling',
  customParams = 'Custom',
  rollingUpdate = 'RollingUpdate',
}

export const KubernetesDeploymentStrategyOptions = {
  [DeploymentStrategyType.recreateParams]: 'Recreate',
  [DeploymentStrategyType.rollingUpdate]: 'Rolling Update',
};

export const OpenshiftDeploymentStrategyOptions = {
  [DeploymentStrategyType.recreateParams]: 'Recreate',
  [DeploymentStrategyType.rollingParams]: 'Rolling',
  [DeploymentStrategyType.customParams]: 'Custom',
};

export const KubernetesDeploymentStrategyHelpText = {
  [DeploymentStrategyType.recreateParams]: 'The recreate strategy has basic rollout behavior.',
  [DeploymentStrategyType.rollingUpdate]:
    'The rolling strategy will wait for pods to pass their readiness check, scale down old components and then scale up.',
};

export const OpenshiftDeploymentStrategyHelpText = {
  [DeploymentStrategyType.recreateParams]:
    'The recreate strategy has basic rollout behavior and supports lifecycle hooks for injecting code into the deployment process.',
  [DeploymentStrategyType.rollingParams]:
    'The rolling strategy will wait for pods to pass their readiness check, scale down old components and then scale up.',
  [DeploymentStrategyType.customParams]:
    'The custom strategy allows you to specify container image that will provide your own deployment behavior.',
};

export const DeploymentStrategyDropdownData = {
  [Resources.Kubernetes]: {
    items: KubernetesDeploymentStrategyOptions,
    helpText: KubernetesDeploymentStrategyHelpText,
  },
  [Resources.OpenShift]: {
    items: OpenshiftDeploymentStrategyOptions,
    helpText: OpenshiftDeploymentStrategyHelpText,
  },
};

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

export const FailurePolicyOptions = {
  [FailurePolicyType.Abort]: 'Abort',
  [FailurePolicyType.Retry]: 'Retry',
  [FailurePolicyType.Ignore]: 'Ignore',
};
