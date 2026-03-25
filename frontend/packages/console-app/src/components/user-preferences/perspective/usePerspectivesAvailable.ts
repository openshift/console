import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';

export const usePerspectivesAvailable = (setFeatureFlag: SetFeatureFlag) => {
  const perspectives = usePerspectives();
  setFeatureFlag('FLAG_PERSPECTIVES_AVAILABLE', perspectives.length > 1);
};
