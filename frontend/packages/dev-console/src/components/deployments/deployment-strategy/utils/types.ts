import { K8sResourceKind } from '@console/internal/module/k8s';
import { Resources } from '../../../import/import-types';

export enum DeploymentStrategyType {
  recreateParams = 'Recreate',
  rollingParams = 'Rolling',
  customParams = 'Custom',
  rollingUpdate = 'RollingUpdate',
}

export type StrategyFieldProps = {
  resourceType?: Resources;
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
