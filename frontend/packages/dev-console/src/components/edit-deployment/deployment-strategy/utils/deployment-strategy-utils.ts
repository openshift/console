import { TFunction } from 'i18next';
import { LifecycleAction } from './types';

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
