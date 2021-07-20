import * as React from 'react';
import { useK8sWatchResource } from '../../../../public/components/utils/k8s-watch-hook';
import { AccessMode, VolumeMode } from '../constants/vm/storage';
import { StorageProfileModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { StorageProfile } from '../types';

export const useStorageProfileSettings = (
  scName: string,
): [AccessMode, VolumeMode, boolean, boolean] => {
  const spWatchResource = React.useMemo(() => {
    return {
      kind: kubevirtReferenceForModel(StorageProfileModel),
      isList: false,
      name: scName,
      namespaced: false,
    };
  }, [scName]);

  const [sp, spLoaded, loadError] = useK8sWatchResource<StorageProfile>(spWatchResource);

  if (loadError) {
    return null;
  }

  if (!sp?.status?.claimPropertySets && spLoaded) {
    return [AccessMode.READ_WRITE_ONCE, VolumeMode.FILESYSTEM, spLoaded, false];
  }

  const accessMode = AccessMode.fromString(sp?.status?.claimPropertySets?.[0].accessModes?.[0]);
  const volumeMode = VolumeMode.fromString(sp?.status?.claimPropertySets?.[0].volumeMode);

  return [accessMode, volumeMode, spLoaded, true];
};
