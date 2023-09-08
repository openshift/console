import { FLAG_OPENSHIFT_BUILDCONFIG } from '@console/dev-console/src/const';
import { FLAG_OPENSHIFT_PIPELINE } from '@console/pipelines-plugin/src/const';
import { useFlag } from '@console/shared';
import { BuildOptions } from '../import-types';

export const useDefaultBuildOption = (): BuildOptions => {
  const isBuildV1Enabled = useFlag(FLAG_OPENSHIFT_BUILDCONFIG);
  const isPipelineEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);

  if (isBuildV1Enabled) {
    return BuildOptions.BUILDS;
  }
  if (isPipelineEnabled) {
    return BuildOptions.PIPELINES;
  }
  return BuildOptions.DISABLED;
};
