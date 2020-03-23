import { iGetIn, immutableListToShallowJS, toShallowJS } from '../../../utils/immutable';
import {
  VMWizardNetwork,
  VMWizardNetworkWithWrappers,
  VMWizardStorage,
  VMWizardStorageWithWrappers,
  VMWizardTab,
} from '../types';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { getCreateVMWizards } from './common';
import { FirehoseResource } from '@console/internal/components/utils';

export const getExtraWSQueries = (state, reduxID: string): FirehoseResource[] => {
  const wizards = getCreateVMWizards(state);
  const iWSQueries = iGetIn(wizards, [reduxID, 'extraWSQueries']);
  if (iWSQueries == null) {
    return [];
  }

  const wsQueries = toShallowJS(iWSQueries, {});

  return Object.keys(wsQueries).reduce((acc, key) => {
    const addon = wsQueries[key];
    if (addon) {
      acc.push(...addon);
    }
    return acc;
  }, []);
};

export const getNetworks = (state, id: string): VMWizardNetwork[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.NETWORKING, 'value']),
  );

export const getStorages = (state, id: string): VMWizardStorage[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.STORAGE, 'value']),
  );

export const getNetworksWithWrappers = (
  state,
  id: string,
  copyWrappers = false,
): VMWizardNetworkWithWrappers[] =>
  getNetworks(state, id).map(({ network, networkInterface, ...rest }) => ({
    networkInterfaceWrapper: new NetworkInterfaceWrapper(networkInterface, copyWrappers),
    networkWrapper: new NetworkWrapper(network, copyWrappers),
    networkInterface,
    network,
    ...rest,
  }));

export const getStoragesWithWrappers = (
  state,
  id: string,
  copyWrappers = false,
): VMWizardStorageWithWrappers[] =>
  getStorages(state, id).map(({ disk, volume, dataVolume, persistentVolumeClaim, ...rest }) => ({
    diskWrapper: new DiskWrapper(disk, copyWrappers),
    volumeWrapper: new VolumeWrapper(volume, copyWrappers),
    dataVolumeWrapper: dataVolume && new DataVolumeWrapper(dataVolume, copyWrappers),
    persistentVolumeClaimWrapper:
      persistentVolumeClaim &&
      new PersistentVolumeClaimWrapper(persistentVolumeClaim, copyWrappers),
    disk,
    volume,
    dataVolume,
    persistentVolumeClaim,
    ...rest,
  }));
