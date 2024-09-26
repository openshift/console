import * as _ from 'lodash';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { BootableDeviceType } from '../../types/types';
import { getBootableDevicesInOrder, getTransformedDevices } from '../vm/devices';
import { getVMIBootableDevicesInOrder, getVMIDevices } from '../vmi/devices';

export const isBootOrderChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmBootOrder: BootableDeviceType[] = getBootableDevicesInOrder(vm.asResource(true));
  const vmiBootOrder: BootableDeviceType[] = getVMIBootableDevicesInOrder(vmi.asResource(true));

  if (vmBootOrder.length !== vmiBootOrder.length) {
    return true;
  }

  // Implicit boot order - no boot order is configured
  // Check whether the order of the disks in the YAML has changed
  if (vmBootOrder.length === 0) {
    const vmDevices = getTransformedDevices(vm.asResource());
    const vmiDevices = getVMIDevices(vmi.asResource());

    return vmDevices.some((bootableDevice, index) => !_.isEqual(bootableDevice, vmiDevices[index]));
  }

  return !vmBootOrder.every(
    (device, index) =>
      device.type === vmiBootOrder[index].type &&
      device.typeLabel === vmiBootOrder[index].typeLabel &&
      device.value.bootOrder === vmiBootOrder[index].value.bootOrder &&
      device.value.name === vmiBootOrder[index].value.name,
  );
};
