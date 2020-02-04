import { get } from 'lodash';
import { Map } from 'immutable';
import { iGetIn, immutableListToShallowJS } from '../../../utils/immutable';
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

export const getCreateVMWizards = (state): Map<string, any> =>
  get(state, ['plugins', 'kubevirt', 'createVmWizards']);

export const getNetworks = (state, id: string): VMWizardNetwork[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.NETWORKING, 'value']),
  );

export const getStorages = (state, id: string): VMWizardStorage[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.STORAGE, 'value']),
  );

export const getNetworksWithWrappers = (state, id: string): VMWizardNetworkWithWrappers[] =>
  getNetworks(state, id).map(({ network, networkInterface, ...rest }) => ({
    networkInterfaceWrapper: new NetworkInterfaceWrapper(networkInterface),
    networkWrapper: new NetworkWrapper(network),
    networkInterface,
    network,
    ...rest,
  }));

export const getStoragesWithWrappers = (state, id: string): VMWizardStorageWithWrappers[] =>
  getStorages(state, id).map(({ disk, volume, dataVolume, persistentVolumeClaim, ...rest }) => ({
    diskWrapper: DiskWrapper.initialize(disk),
    volumeWrapper: VolumeWrapper.initialize(volume),
    dataVolumeWrapper: dataVolume && DataVolumeWrapper.initialize(dataVolume),
    persistentVolumeClaimWrapper:
      persistentVolumeClaim && PersistentVolumeClaimWrapper.initialize(persistentVolumeClaim),
    disk,
    volume,
    dataVolume,
    persistentVolumeClaim,
    ...rest,
  }));
