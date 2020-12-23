/**
 * Provides mapping from VMWare GuesId to common-templates operating system.
 *
 * https://code.vmware.com/docs/4206/vsphere-web-services-api-reference#/doc/vim.vm.GuestOsDescriptor.GuestOsIdentifier.html
 *
 * The vmwareToKubevirtOsConfigMap is usually created by the web-ui-operator and can be missing.
 */
import * as _ from 'lodash';
import { alignWithDNS1123 } from '@console/shared/src';
import { ConfigMapKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import { InternalActionType, UpdateOptions } from '../../../types';
import { iGetVMWareFieldAttribute } from '../../../../selectors/immutable/provider/vmware/selectors';
import {
  VMSettingsField,
  VMWareProviderField,
  VMWareProviderProps,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../../../types';
import { iGetCommonData, iGetLoadedCommonData } from '../../../../selectors/immutable/selectors';
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
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../../../selectors/config-map/sc-defaults';
import { toShallowJS } from '../../../../../../utils/immutable';
import { NetworkWrapper } from '../../../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../../../k8s/wrapper/vm/network-interface-wrapper';
import { DiskWrapper } from '../../../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../../../k8s/wrapper/vm/volume-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { BinaryUnit, convertToHighestUnit } from '../../../../../form/size-unit-utils';
import { VMwareFirmware } from '../../../../../../constants/v2v-import/vmware/vmware-firmware';

export const getNics = (parsedVm): VMWizardNetwork[] => {
  const devices = _.get(parsedVm, ['Config', 'Hardware', 'Device']);

  // If the device is a network card, it has "MacAddress" present
  // Source:
  //   - https://www.vmware.com/support/developer/converter-sdk/conv50_apireference/vim.vm.device.VirtualDevice.BackingInfo.html
  //   - https://www.vmware.com/support/developer/converter-sdk/conv50_apireference/vim.vm.device.VirtualDevice.html
  const networkDevices = (devices || []).filter((device) => _.has(device, 'MacAddress'));
  return networkDevices.map((device, idx) => {
    const name = alignWithDNS1123(_.get(device, ['DeviceInfo', 'Label']));
    const macAddress = device.MacAddress;
    const networkWrapper = new NetworkWrapper().init({ name });

    if (networkDevices.length === 1) {
      networkWrapper.setType(NetworkType.POD); // default to POD
    }

    return {
      id: `${idx + 1}`,
      type: VMWizardNetworkType.V2V_VMWARE_IMPORT,
      network: networkWrapper.asResource(),
      networkInterface: new NetworkInterfaceWrapper()
        .init({
          name,
          model: NetworkInterfaceModel.VIRTIO,
          macAddress,
        })
        .setType(NetworkInterfaceType.BRIDGE)
        .asResource(),
    };
  });
};

export const getDisks = (
  parsedVm,
  storageClassConfigMap: ConfigMapKind,
  defaultSC?: StorageClassResourceKind,
): VMWizardStorage[] => {
  const devices = _.get(parsedVm, ['Config', 'Hardware', 'Device']);

  // if the device is a disk, it has "capacityInKB" present
  // Alternatively:
  //   diskObjectId - since vSphere API 5.5
  //   capacityInBytes - since vSphere API 5.5
  //   capacityInKB - deprecated since vSphere API 5.5
  // https://www.vmware.com/support/developer/converter-sdk/conv50_apireference/vim.vm.device.VirtualDisk.html
  // TODO: what about CDROM, Floppy, VirtualSCSIPassthrough,
  const diskDevices = (devices || []).filter(
    (device) => _.has(device, 'CapacityInKB') || _.has(device, 'CapacityInBytes'),
  );

  return diskDevices.map((device, idx) => {
    const unit = _.isNumber(device.CapacityInKB) ? BinaryUnit.Ki : BinaryUnit.B;
    const size = convertToHighestUnit(
      (unit === BinaryUnit.B ? device.CapacityInBytes : device.CapacityInKB) || 0,
      unit,
    );

    const name = alignWithDNS1123(_.get(device, ['DeviceInfo', 'Label']));
    const bootOrder = idx === 0 ? 1 : undefined;

    return {
      id: `${idx + 1}`,
      type: VMWizardStorageType.V2V_VMWARE_IMPORT,
      disk: DiskWrapper.initializeFromSimpleData({
        name,
        bus: DiskBus.VIRTIO,
        type: DiskType.DISK,
        bootOrder,
      }).asResource(),
      volume: VolumeWrapper.initializeFromSimpleData({
        name,
        type: VolumeType.PERSISTENT_VOLUME_CLAIM,
        typeData: { claimName: name },
      }).asResource(),
      persistentVolumeClaim: new PersistentVolumeClaimWrapper()
        .init({
          name,
          size: size.value,
          unit: size.unit,
        })
        .setStorageClassName(defaultSC?.metadata?.name || '')
        .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
        .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
        .asResource(),
      importData: {
        fileName: _.get(device, ['Backing', 'FileName']),
        mountPath: `/data/vm/disk${idx + 1}`, // hardcoded
        devicePath: `/data/vm/disk${idx + 1}/disk.img`, // hardcoded
      },
    };
  });
};

// update checks done in vmWareStateUpdate
export const prefillUpdateCreator = (
  options: UpdateOptions,
  defaultSC: StorageClassResourceKind,
) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const vm = iGetVMWareFieldAttribute(state, id, VMWareProviderField.VM, 'vm');
  const vmwareToKubevirtOsConfigMap = toShallowJS(
    iGetLoadedCommonData(state, id, VMWareProviderProps.vmwareToKubevirtOsConfigMap),
    undefined,
    true,
  );
  const storageClassConfigMap = toShallowJS(
    iGetLoadedCommonData(state, id, VMWizardProps.storageClassConfigMap),
    undefined,
    true,
  );
  const isSimpleView = iGetCommonData(state, id, VMWizardProps.isSimpleView);

  const raw = vm.getIn(['detail', 'raw']);

  const parsedVm = JSON.parse(raw);

  const firmware = VMwareFirmware.fromString(parsedVm?.Config?.Firmware);

  if (!firmware?.isSupported()) {
    return; // unsupported - let the validations handle rest
  }

  const memory = _.get(parsedVm, ['Config', 'Hardware', 'MemoryMB']);
  const guestId = _.get(parsedVm, ['Config', 'GuestId']);
  const kubevirtId = _.get(vmwareToKubevirtOsConfigMap, ['data', guestId]);
  const memWithUnit = memory ? convertToHighestUnit(memory, BinaryUnit.Mi) : null;

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.NAME]: {
        value: alignWithDNS1123(_.get(parsedVm, ['Config', 'Name'], null)),
      },
      [VMSettingsField.DESCRIPTION]: {
        value: _.get(parsedVm, ['Config', 'Annotation'], null),
      },
      [VMSettingsField.MEMORY]: {
        value: memWithUnit ? `${memWithUnit.value}${memWithUnit.unit}` : null,
      },
      [VMSettingsField.CPU]: {
        value: _.get(parsedVm, ['Config', 'Hardware', 'NumCPU'], null),
      },
      [VMSettingsField.OPERATING_SYSTEM]: {
        value: kubevirtId || null,
        guestFullName: _.get(parsedVm, ['Config', 'GuestFullName'], null),
      },
      [VMSettingsField.FLAVOR]: {
        value: CUSTOM_FLAVOR,
      },
      [VMSettingsField.WORKLOAD_PROFILE]: {
        value: isSimpleView ? 'server' : null, // guess - will be erased by vm settings updater if guessed incorrectly
      },
    }),
  );
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, getNics(parsedVm)));
  dispatch(
    vmWizardInternalActions[InternalActionType.SetStorages](
      id,
      getDisks(parsedVm, storageClassConfigMap, defaultSC),
    ),
  );
};
