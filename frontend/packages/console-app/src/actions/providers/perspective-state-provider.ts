import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import {
  hasReviewAccess,
  Perspective,
  PerspectiveVisibilityState,
} from '@console/shared/src/hooks/perspective-utils';
import { FLAG_DEVELOPER_PERSPECTIVE } from '../../consts';

export const useDeveloperPerspectiveStateProvider = (setFeatureFlag: SetFeatureFlag) => {
  if (!window.SERVER_FLAGS.perspectives) {
    setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, true);
  } else {
    const perspectives: Perspective[] = JSON.parse(window.SERVER_FLAGS.perspectives);
    const devPerspective = perspectives?.find((p) => p.id === 'dev');
    if (!devPerspective) {
      setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, true);
    } else if (devPerspective.visibility.state === PerspectiveVisibilityState.Disabled) {
      setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, false);
    } else if (devPerspective.visibility.state === PerspectiveVisibilityState.Enabled) {
      setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, true);
    } else if (devPerspective.visibility.state === PerspectiveVisibilityState.AccessReview) {
      hasReviewAccess(devPerspective?.visibility?.accessReview)
        .then((res) => {
          setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, res);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Could not check access', e);
        });
    }
  }
};
