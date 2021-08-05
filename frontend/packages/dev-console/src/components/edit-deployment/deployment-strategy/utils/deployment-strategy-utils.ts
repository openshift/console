import { TFunction } from 'i18next';
import { Resources } from '../../../import/import-types';
import { DeploymentStrategyType, LifecycleAction } from './types';

export const getDeploymentStrategyItems = (resourceType: Resources, t: TFunction) => {
  switch (resourceType) {
    case Resources.Kubernetes:
      return {
        [DeploymentStrategyType.recreateParams]: t('devconsole~Recreate'),
        [DeploymentStrategyType.rollingUpdate]: t('devconsole~Rolling Update'),
      };
    case Resources.OpenShift:
      return {
        [DeploymentStrategyType.recreateParams]: t('devconsole~Recreate'),
        [DeploymentStrategyType.rollingParams]: t('devconsole~Rolling'),
        [DeploymentStrategyType.customParams]: t('devconsole~Custom'),
      };
    default:
      return {};
  }
};

export const getDeploymentStrategyHelpText = (
  resourceType: Resources,
  deploymentStrategyType: DeploymentStrategyType,
  t: TFunction,
): string => {
  switch (resourceType) {
    case Resources.Kubernetes:
      switch (deploymentStrategyType) {
        case DeploymentStrategyType.recreateParams:
          return t('devconsole~The recreate strategy has basic rollout behavior.');
        case DeploymentStrategyType.rollingUpdate:
          return t(
            'devconsole~The rolling strategy will wait for pods to pass their readiness check, scale down old components and then scale up.',
          );
        default:
          return null;
      }
    case Resources.OpenShift:
      switch (deploymentStrategyType) {
        case DeploymentStrategyType.recreateParams:
          return t(
            'devconsole~The recreate strategy has basic rollout behavior and supports lifecycle hooks for injecting code into the deployment process.',
          );
        case DeploymentStrategyType.rollingParams:
          return t(
            'devconsole~The rolling strategy will wait for pods to pass their readiness check, scale down old components and then scale up.',
          );
        case DeploymentStrategyType.customParams:
          return t(
            'devconsole~The custom strategy allows you to specify container image that will provide your own deployment behavior.',
          );
        default:
          return null;
      }
    default:
      return null;
  }
};

export const lifecycleActionType = (t: TFunction) => {
  return {
    execNewPod: {
      value: LifecycleAction.execNewPod,
      label: t(
        'devconsole~Runs a command in a new pod using the container from the deployment template. You can add additional environment variables and volumes',
      ),
    },
    tagImages: {
      value: LifecycleAction.tagImages,
      label: t(
        'devconsole~Tags the current image as an image stream tag if the deployment succeeds',
      ),
    },
  };
};
