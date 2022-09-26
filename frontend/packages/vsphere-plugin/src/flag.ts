import * as React from 'react';
import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { k8sGet, useK8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { VSPHERE_FEATURE_FLAG, VSPHERE_PLATFORM } from './constants';
import { Infrastructure } from './resources';

export const useVSphereFlagHandler = (setFeatureFlag: SetFeatureFlag) => {
  const [InfrastructureModel] = useK8sModel({
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Infrastructure',
  });

  React.useEffect(() => {
    const doItAsync = async () => {
      try {
        const infra = await k8sGet<Infrastructure>({
          model: InfrastructureModel,
          name: 'cluster',
        });

        if (infra?.status?.platform === VSPHERE_PLATFORM) {
          setFeatureFlag(VSPHERE_FEATURE_FLAG, true);
          return;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error when reading infrastructure CR: ', e);
      }

      setFeatureFlag(VSPHERE_FEATURE_FLAG, false);
    };

    if (InfrastructureModel) {
      doItAsync();
    }
  }, [InfrastructureModel, setFeatureFlag]);
};
