import * as React from 'react';
import { FLAG_OPENSHIFT_BUILDCONFIG } from '@console/dev-console/src/const';
import { useShipwrightBuilds } from '@console/dev-console/src/utils/shipwright-build-hook';
import { FLAG_OPENSHIFT_PIPELINE } from '@console/pipelines-plugin/src/const';
import { useFlag } from '@console/shared';
import { BuildOptions } from '../import-types';

export const useDefaultBuildOption = (): BuildOptions => {
  const isBuildV1Enabled = useFlag(FLAG_OPENSHIFT_BUILDCONFIG);
  const isShipwrightEnabled = useShipwrightBuilds();
  const isPipelineEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);

  const defaultBuildOption = React.useMemo(() => {
    if (isShipwrightEnabled) {
      return BuildOptions.SHIPWRIGHT_BUILD;
    }
    if (isBuildV1Enabled) {
      return BuildOptions.BUILDS;
    }
    if (isPipelineEnabled) {
      return BuildOptions.PIPELINES;
    }
    return BuildOptions.DISABLED;
  }, [isBuildV1Enabled, isShipwrightEnabled, isPipelineEnabled]);

  return defaultBuildOption;
};
