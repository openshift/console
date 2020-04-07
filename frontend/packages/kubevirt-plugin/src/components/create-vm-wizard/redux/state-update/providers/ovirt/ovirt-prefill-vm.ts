import * as _ from 'lodash';
import { alignWithDNS1123 } from '@console/shared/src';
import { InternalActionType, UpdateOptions } from '../../../types';
import {
  OvirtProviderField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../../../types';
import { vmWizardInternalActions } from '../../../internal-actions';
import {
  CUSTOM_FLAVOR,
  DiskBus,
  DiskType,
  NetworkInterfaceModel,
  NetworkInterfaceType,
  NetworkType,
  VolumeType,
} from '../../../../../../constants/vm';
import { NetworkWrapper } from '../../../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../../../k8s/wrapper/vm/network-interface-wrapper';
import { BinaryUnit, convertToHighestUnit } from '../../../../../form/size-unit-utils';
import { OvirtVM } from '../../../../../../types/vm-import/ovirt/ovirt-vm';
import { iGetOvirtFieldAttribute } from '../../../../selectors/immutable/provider/ovirt/selectors';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { DiskWrapper } from '../../../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../../../k8s/wrapper/vm/volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../../../selectors/config-map/sc-defaults';
import { toShallowJS } from '../../../../../../utils/immutable';
import { iGetLoadedCommonData } from '../../../../selectors/immutable/selectors';
import { OvirtDiskBus } from '../../../../../../constants/v2v-import/ovirt/ovirt-disk-bus';
import { OvirtNetworkInterfaceModel } from '../../../../../../constants/v2v-import/ovirt/ovirt-network-interface-model';
import { createUniqueNameResolver } from '../../../../../../utils/strings';
import { PersistentVolumeClaimWrapper } from '../../../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';

export const getDisks = (vm: OvirtVM, storageClassConfigMap: ConfigMapKind): VMWizardStorage[] => {
  const { boot, disks } = vm;
  let bootOrder = 0;
  const getUniqueName = createUniqueNameResolver(disks);

  return (disks || []).map((disk, idx) => {
    const name = alignWithDNS1123(getUniqueName(disk.name) || disk.id);
    const size = convertToHighestUnit(disk.size, BinaryUnit.B);
    const bootable = boot.includes('hd') && disk.bootable;

    if (bootable) {
      bootOrder++;
    }

    return {
      id: `${disk.id}-${idx + 1}`,
      type: VMWizardStorageType.V2V_OVIRT_IMPORT,
      disk: new DiskWrapper()
        .init({ name, bootOrder: bootable ? bootOrder : undefined })
        .setType(DiskType.DISK, {
          bus: OvirtDiskBus.fromString(disk.interface)?.getKubevirtBus() || DiskBus.VIRTIO,
        })
        .asResource(),
      volume: new VolumeWrapper()
        .init({ name })
        .setType(VolumeType.PERSISTENT_VOLUME_CLAIM, { claimName: name })
        .asResource(),
      persistentVolumeClaim: new PersistentVolumeClaimWrapper() // just to show import type - not used actually
        .init({
          name,
          size: size.value,
          unit: size.unit,
        })
        .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
        .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
        .asResource(),
      importData: {
        id: disk.id,
      },
      editConfig: {
        disableEditing: true,
        isFieldEditableOverride: {
          storageClass: true,
        },
      },
    };
  });
};

export const getNics = (vm: OvirtVM): VMWizardNetwork[] => {
  const getUniqueName = createUniqueNameResolver(vm.nics);
  const nics = (vm.nics || []).filter((n) => n);

  return nics.map((nic, idx) => {
    const name = alignWithDNS1123(getUniqueName(nic.name) || nic.id);
    const networkWrapper = new NetworkWrapper().init({ name });

    if (nics.length === 1) {
      networkWrapper.setType(NetworkType.POD); // default to POD
    }
    return {
      id: `${nic.id}-${idx + 1}`,
      type: VMWizardNetworkType.V2V_OVIRT_IMPORT,
      network: networkWrapper.asResource(),
      networkInterface: new NetworkInterfaceWrapper()
        .init({
          name,
          model:
            OvirtNetworkInterfaceModel.fromString(
              nic.interface,
            )?.getKubevirtNetworkInterfaceModel() || NetworkInterfaceModel.VIRTIO,
          macAddress: nic.mac,
        })
        .setType(NetworkInterfaceType.BRIDGE)
        .asResource(),
      importData: {
        id: nic.id,
      },
      editConfig: {
        disableEditing: true,
        isFieldEditableOverride: {
          network: true,
        },
      },
    };
  });
};

const getWorkload = (vm: OvirtVM) => {
  return vm?.vmtype?.replace('_', '') || 'server';
};

const getCPU = (vm: OvirtVM) => {
  const { cores = 1, cpusockets = 1, cputhreads = 1 } = vm?.cpu || {};
  return cpusockets * cores * cputhreads;
};

const getOS = (vm: OvirtVM) => {
  const { osdist, ostype, osversion } = vm?.os || {};

  const result = ostype || (osdist ? `${osdist}${osversion || ''}` : 'Unknown');

  return _.capitalize(result.replace('_', ' '));
};

// update checks done in ovirt-state-update
export const prefillUpdateCreator = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const iVM = iGetOvirtFieldAttribute(state, id, OvirtProviderField.VM, 'vm');
  const vm: OvirtVM = JSON.parse(iVM.getIn(['detail', 'raw'])) || {};

  const { memory, name } = vm;

  const memWithUnit = memory ? convertToHighestUnit(memory, BinaryUnit.B) : null;

  const storageClassConfigMap = toShallowJS(
    iGetLoadedCommonData(state, id, VMWizardProps.storageClassConfigMap),
    undefined,
    true,
  );

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.NAME]: {
        value: alignWithDNS1123(name),
      },
      [VMSettingsField.MEMORY]: {
        value: memWithUnit ? `${memWithUnit.value}${memWithUnit.unit}` : null,
      },
      [VMSettingsField.CPU]: {
        value: getCPU(vm),
      },
      [VMSettingsField.OPERATING_SYSTEM]: {
        display: getOS(vm),
      },
      [VMSettingsField.FLAVOR]: {
        value: CUSTOM_FLAVOR,
      },
      [VMSettingsField.WORKLOAD_PROFILE]: {
        value: getWorkload(vm),
      },
    }),
  );
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, getNics(vm)));
  dispatch(
    vmWizardInternalActions[InternalActionType.SetStorages](
      id,
      getDisks(vm, storageClassConfigMap),
    ),
  );
};
