import * as _ from 'lodash';
import { alignWithDNS1123, joinGrammaticallyListOfItems, getName } from '@console/shared/src';
import { InternalActionType, UpdateOptions } from '../../../types';
import {
  OvirtProviderField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
  OvirtProviderProps,
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
import { ConfigMapKind, K8sResourceKind } from '@console/internal/module/k8s';
import { DiskWrapper } from '../../../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../../../k8s/wrapper/vm/volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../../../selectors/config-map/sc-defaults';
import { toShallowJS, immutableListToShallowJS } from '../../../../../../utils/immutable';
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
      persistentVolumeClaim: new PersistentVolumeClaimWrapper()
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
          volumeMode: true,
        },
      },
    };
  });
};

export const getNics = (vm: OvirtVM, nads: K8sResourceKind[]): VMWizardNetwork[] => {
  const getUniqueName = createUniqueNameResolver(vm.nics);
  const nics = (vm.nics || []).filter(
    (nic) => nic?.name && nic?.vnicid != null && nic?.vnicid !== '',
  );

  const nicProfileMapping = {};

  const sriovNicCount = nics.filter((nic) => nic.sriov).length;
  const sriovNads = nads.filter(
    (nad) => JSON.parse(nad?.spec?.config)?.type === NetworkInterfaceType.SRIOV.getValue(),
  );

  const results: VMWizardNetwork[] = nics.map((nic, idx) => {
    const name = alignWithDNS1123(getUniqueName(nic.name) || nic.id);

    const nicNames = nicProfileMapping[nic.vnicid] || [];
    nicNames.push(name);
    nicProfileMapping[nic.vnicid] = nicNames;

    const networkWrapper = new NetworkWrapper().init({ name });

    if (nic.sriov) {
      if (sriovNicCount === 1 && sriovNads.length === 1) {
        networkWrapper.setType(NetworkType.MULTUS, { networkName: getName(sriovNads[0]) });
      }
    } else if (nics.length - sriovNicCount === 1) {
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
        .setType(nic.sriov ? NetworkInterfaceType.SRIOV : NetworkInterfaceType.BRIDGE)
        .asResource(),
      importData: {
        id: nic.id,
        vnicID: nic.vnicid,
      },
      editConfig: {
        disableEditing: true,
        isFieldEditableOverride: {
          network: true,
        },
        allowPodNetworkOverride: nic.sriov ? false : undefined,
        allowedMultusNetworkTypes: nic.sriov ? [NetworkInterfaceType.SRIOV.getValue()] : undefined,
      },
    };
  });

  results.forEach((wizardNetwork) => {
    const networksWithSameVnicID = nicProfileMapping[wizardNetwork.importData.vnicID].filter(
      (nicName) => nicName !== wizardNetwork.networkInterface.name,
    );
    if (networksWithSameVnicID.length > 0) {
      wizardNetwork.importData.networksWithSameVnicID = networksWithSameVnicID;
      wizardNetwork.editConfig.allowPodNetworkOverride = false;
      wizardNetwork.editConfig.warning = `This network interface has to use the same network as ${joinGrammaticallyListOfItems(
        networksWithSameVnicID,
      )}`;
    }
  });

  return results;
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

  const { memory, name, description } = vm;

  const memWithUnit = memory ? convertToHighestUnit(memory, BinaryUnit.B) : null;

  const storageClassConfigMap = toShallowJS(
    iGetLoadedCommonData(state, id, VMWizardProps.storageClassConfigMap),
    undefined,
    true,
  );
  const nads = immutableListToShallowJS(
    iGetLoadedCommonData(state, id, OvirtProviderProps.networkAttachmentDefinitions),
  );

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.NAME]: {
        value: alignWithDNS1123(name),
      },
      [VMSettingsField.DESCRIPTION]: {
        value: description || null,
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
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, getNics(vm, nads)));
  dispatch(
    vmWizardInternalActions[InternalActionType.SetStorages](
      id,
      getDisks(vm, storageClassConfigMap),
    ),
  );
};
