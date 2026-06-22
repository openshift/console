import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { hasReviewAccess } from '@console/shared/src/hooks/usePerspectives';
import {
  PerspectiveVisibilityState,
  overridePerspectives,
} from '@console/shared/src/utils/override-perspectives';
import { FLAG_DEVELOPER_PERSPECTIVE } from '../../consts';

export const useDeveloperPerspectiveStateProvider = (setFeatureFlag: SetFeatureFlag) => {
  if (!overridePerspectives) {
    setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, true);
  } else {
    const devPerspective = overridePerspectives.find((p) => p.id === 'dev');
    if (!devPerspective) {
      setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, true);
    } else if (devPerspective.visibility.state === PerspectiveVisibilityState.Disabled) {
      setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, false);
    } else if (devPerspective.visibility.state === PerspectiveVisibilityState.Enabled) {
      setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, true);
    } else if (devPerspective.visibility.state === PerspectiveVisibilityState.AccessReview) {
      const accessReview = devPerspective?.visibility?.accessReview;
      if (accessReview) {
        hasReviewAccess(accessReview)
          .then((res) => {
            setFeatureFlag(FLAG_DEVELOPER_PERSPECTIVE, res);
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.warn('Could not check access', e);
          });
      }
    }
  }
};
