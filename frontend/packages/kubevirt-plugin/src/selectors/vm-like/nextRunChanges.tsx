import * as React from 'react';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import * as _ from 'lodash';
import { BootableDeviceType } from '../../types/types';
import { VMKind, VMIKind } from '../../types/vm';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { MODAL_RESTART_IS_REQUIRED } from '../../strings/vm/status';
import { IsPendingChange } from '../../components/vms/types';
import { getBootableDevicesInOrder } from '../vm/devices';
import { getVMIBootableDevicesInOrder } from '../vmi/devices';
import { mapCDsToSource } from '../../components/modals/cdrom-vm-modal/helpers';
import { K8sResourceKind } from '../../../../../public/module/k8s/types';

import './nextRunChanges.scss';
import { createBasicLookup } from '../../../../console-shared/src/utils/utils';
import { getSimpleName } from '../utils';

export const isNicsChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  const vmNics = vm.getNetworkInterfaces();
  const vmiNics = vmi.getNetworkInterfaces();

  if (vmNics.length !== vmiNics.length) {
    return true;
  }

  const vmNicsLookup = createBasicLookup(vmNics, getSimpleName);
  const vmiNicsLookup = createBasicLookup(vmiNics, getSimpleName);

  return !Object.keys(vmNicsLookup).every(
    (vmNicName) =>
      !!vmiNicsLookup[vmNicName] && _.isEqual(vmiNicsLookup[vmNicName], vmNicsLookup[vmNicName]),
  );
};

export const isFlavorChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  return (
    vm.getFlavor() !== vmi.getFlavor() ||
    !_.isEqual(vm.getMemory(), vmi.getMemory()) ||
    !_.isEqual(vm.getCPU(), vmi.getCPU())
  );
};

export const isCDROMChanged = (
  vm: VMWrapper,
  vmi: VMIWrapper,
  dataVolumes: K8sResourceKind[],
): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  const vmiCDs = mapCDsToSource(vmi.getCDROMs(), vmi.asResource(), dataVolumes);
  const vmCDs = mapCDsToSource(vm.getCDROMs(), vm.asResource());

  const vmCDNames = Object.keys(vmCDs);
  const vmiCDNames = Object.keys(vmiCDs);
  if (vmCDNames.length !== vmiCDNames.length) {
    return true;
  }

  return !vmCDNames.every(
    (name) =>
      vmiCDNames.includes(name) &&
      _.isEqual(_.omit(vmiCDs[name], 'cdrom.readonly', 'cdrom.tray'), vmCDs[name]),
  );
};

export const isBootOrderChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  const vmBootOrder: BootableDeviceType[] = getBootableDevicesInOrder(vm.asResource(true));
  const vmiBootOrder: BootableDeviceType[] = getVMIBootableDevicesInOrder(vmi.asResource(true));

  if (vmBootOrder.length !== vmiBootOrder.length) {
    return true;
  }

  return !vmBootOrder.every(
    (device, index) =>
      device.type === vmiBootOrder[index].type &&
      device.typeLabel === vmiBootOrder[index].typeLabel &&
      device.value.bootOrder === vmiBootOrder[index].value.bootOrder &&
      device.value.name === vmiBootOrder[index].value.name,
  );
};

export const getRemovedDiskNames = (vm: VMWrapper, vmi: VMIWrapper): string[] => {
  if (!vm || !vmi) {
    return [];
  }

  const vmDisks = vm.getDisks();
  return vmi
    .getDisks()
    .map((vmiDisk) => !vmDisks.find((vmDisk) => vmDisk.name === vmiDisk.name) && vmiDisk.name);
};

export const detectNextRunChanges = (vm: VMKind, vmi: VMIKind, dataVolumes: K8sResourceKind[]) => {
  const vmWrapper = new VMWrapper(vm);
  const vmiWrapper = new VMIWrapper(vmi);

  return {
    [IsPendingChange.flavor]: !!vmi && isFlavorChanged(vmWrapper, vmiWrapper),
    [IsPendingChange.cdroms]: !!vmi && isCDROMChanged(vmWrapper, vmiWrapper, dataVolumes),
    [IsPendingChange.bootOrder]: !!vmi && isBootOrderChanged(vmWrapper, vmiWrapper),
  };
};

type PendingChangesAlertProps = {
  warningMsg?: string;
};

export const PendingChangesAlert: React.FC<PendingChangesAlertProps> = ({ warningMsg }) => (
  <Alert
    title="Pending Changes"
    isInline
    variant={warningMsg ? AlertVariant.warning : AlertVariant.info}
    className="kubevirt-vm-details__restart_required-class-alert"
  >
    {warningMsg || MODAL_RESTART_IS_REQUIRED}
  </Alert>
);
