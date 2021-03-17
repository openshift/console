import { Resources } from '../../../import/import-types';

export enum DeploymentStrategyType {
  recreate = 'recreate',
  rolling = 'rolling',
  custom = 'custom',
}

export const KubernetesDeploymentStrategyOptions = {
  [DeploymentStrategyType.recreate]: 'Recreate',
  [DeploymentStrategyType.rolling]: 'Rolling Update',
};

export const OpenshiftDeploymentStrategyOptions = {
  [DeploymentStrategyType.recreate]: 'Recreate',
  [DeploymentStrategyType.rolling]: 'Rolling',
  [DeploymentStrategyType.custom]: 'Custom',
};

export const KubernetesDeploymentStrategyHelpText = {
  [DeploymentStrategyType.recreate]: 'Recreate',
  [DeploymentStrategyType.rolling]: 'Rolling Update',
};

export const OpenshiftDeploymentStrategyHelpText = {
  [DeploymentStrategyType.recreate]: 'Recreate',
  [DeploymentStrategyType.rolling]: 'Rolling',
  [DeploymentStrategyType.custom]: 'Custom',
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
  resourceType: string;
};

export enum LifecycleAction {
  execNewPod = 'execNewPod',
  tagImages = 'tagImages[]',
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
