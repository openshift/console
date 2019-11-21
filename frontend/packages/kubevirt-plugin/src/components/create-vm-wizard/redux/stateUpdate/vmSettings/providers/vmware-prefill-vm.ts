/**
 * Provides mapping from VMWare GuesId to common-templates operating system.
 *
 * https://code.vmware.com/docs/4206/vsphere-web-services-api-reference#/doc/vim.vm.GuestOsDescriptor.GuestOsIdentifier.html
 *
 * The vmwareToKubevirtOsConfigMap is usually created by the web-ui-operator and can be missing.
 */
import * as _ from 'lodash';
import { InternalActionType, UpdateOptions } from '../../../types';
import { iGetVMWareFieldAttribute } from '../../../../selectors/immutable/provider/vmware/selectors';
import {
  VMSettingsField,
  VMWareProviderField,
  VMWareProviderProps,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../../../types';
import { iGetLoadedCommonData } from '../../../../selectors/immutable/selectors';
import { vmWizardInternalActions } from '../../../internal-actions';
import {
  CUSTOM_FLAVOR,
  DiskBus,
  DiskType,
  NetworkInterfaceModel,
  NetworkInterfaceType,
  VolumeType,
} from '../../../../../../constants/vm';
import { toShallowJS } from '../../../../../../utils/immutable';
import { NetworkWrapper } from '../../../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../../../k8s/wrapper/vm/network-interface-wrapper';
import { DiskWrapper } from '../../../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../../../k8s/wrapper/vm/volume-wrapper';
import { CONVERSION_POD_TEMP_MOUNT_PATH } from '../../../../../../constants/v2v';
import { PersistentVolumeClaimWrapper } from '../../../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { getStringEnumValues } from '../../../../../../utils/types';
import { BinaryUnit } from '../../../../../form/size-unit-utils';

const convert = (value: number, unit: BinaryUnit) => {
  const units = getStringEnumValues<BinaryUnit>(BinaryUnit);
  const sliceIndex = units.indexOf(unit);
  const slicedUnits = sliceIndex === -1 ? units : units.slice(sliceIndex);

  let nextValue = value;
  let nextUnit = slicedUnits.shift();
  while (nextValue !== 0 && nextValue % 1024 === 0 && slicedUnits.length > 0) {
    nextValue /= 1024;
    nextUnit = slicedUnits.shift();
  }
  return { value: nextValue, unit: nextUnit };
};

export const getNics = (parsedVm): VMWizardNetwork[] => {
  const devices = _.get(parsedVm, ['Config', 'Hardware', 'Device']);

  // If the device is a network card, it has "MacAddress" present
  // Source:
  //   - https://www.vmware.com/support/developer/converter-sdk/conv50_apireference/vim.vm.device.VirtualDevice.BackingInfo.html
  //   - https://www.vmware.com/support/developer/converter-sdk/conv50_apireference/vim.vm.device.VirtualDevice.html
  const networkDevices = (devices || []).filter((device) => _.has(device, 'MacAddress'));
  return networkDevices.map((device, idx) => {
    const name = _.get(device, ['DeviceInfo', 'Label']);
    const macAddress = device.MacAddress;
    return {
      id: idx + 1,
      type: VMWizardNetworkType.V2V_VMWARE_IMPORT,
      network: NetworkWrapper.initializeFromSimpleData({ name }).asResource(),
      networkInterface: NetworkInterfaceWrapper.initializeFromSimpleData({
        name,
        model: NetworkInterfaceModel.VIRTIO,
        macAddress,
        interfaceType: NetworkInterfaceType.BRIDGE,
      }).asResource(),
    };
  });
};

export const getDisks = (parsedVm): VMWizardStorage[] => {
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

  const diskRows = diskDevices.map((device, idx) => {
    const unit = _.isNumber(device.CapacityInKB) ? BinaryUnit.Ki : BinaryUnit.B;
    const size = convert(
      (unit === BinaryUnit.B ? device.CapacityInBytes : device.CapacityInKB) || 0,
      unit,
    );

    const name = _.get(device, ['DeviceInfo', 'Label']);
    const bootOrder = idx === 0 ? 0 : undefined;

    return {
      id: idx + 1,
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
      persistentVolumeClaim: PersistentVolumeClaimWrapper.initializeFromSimpleData({
        name,
        size: size.value,
        unit: size.unit,
      }).asResource(),
      importData: {
        fileName: _.get(device, ['Backing', 'FileName']),
        mountPath: `/data/vm/disk${idx + 1}`, // hardcoded
        devicePath: `/data/vm/disk${idx + 1}`, // hardcoded
      },
    };
  });

  // temp disk needed for conversion pod
  const name = 'v2v-conversion-temp';
  diskRows.push({
    id: diskRows.length + 1,
    type: VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP,
    disk: DiskWrapper.initializeFromSimpleData({
      name,
      bus: DiskBus.VIRTIO,
      type: DiskType.DISK,
    }).asResource(),
    volume: VolumeWrapper.initializeFromSimpleData({
      name,
      type: VolumeType.PERSISTENT_VOLUME_CLAIM,
      typeData: { claimName: name },
    }).asResource(),
    persistentVolumeClaim: PersistentVolumeClaimWrapper.initializeFromSimpleData({
      name,
      size: 2,
      unit: BinaryUnit.Gi,
    }).asResource(),
    importData: {
      mountPath: CONVERSION_POD_TEMP_MOUNT_PATH, // hardcoded; always Filesystem mode
    },
  });

  return diskRows;
};

// update checks done in vmWareStateUpdate
export const prefillUpdateCreator = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const vm = iGetVMWareFieldAttribute(state, id, VMWareProviderField.VM, 'vm');
  const vmwareToKubevirtOsConfigMap = toShallowJS(
    iGetLoadedCommonData(state, id, VMWareProviderProps.vmwareToKubevirtOsConfigMap),
    true,
  );

  const raw = vm.getIn(['detail', 'raw']);

  const parsedVm = JSON.parse(raw);

  const memory = _.get(parsedVm, ['Config', 'Hardware', 'MemoryMB']);
  const guestId = _.get(parsedVm, ['Config', 'GuestId']);
  const kubevirtId = _.get(vmwareToKubevirtOsConfigMap, ['data', guestId]);

  dispatch(
    vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, {
      [VMSettingsField.NAME]: {
        value: _.get(parsedVm, ['Config', 'Name'], null),
      },
      [VMSettingsField.DESCRIPTION]: {
        value: _.get(parsedVm, ['Config', 'Annotation'], null),
      },
      [VMSettingsField.MEMORY]: {
        value: memory ? memory / 1024 : null,
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
        value: null,
      },
    }),
  );
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, getNics(parsedVm)));
  dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, getDisks(parsedVm)));
};
