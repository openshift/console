import * as _ from 'lodash';
import { getName } from '@console/shared/src/selectors/common';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import {
  BUS_VIRTIO,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { V1Network, V1NetworkInterface, VMKind, VMIKind, CPURaw } from '../../types';
import { findKeySuffixValue, getSimpleName, getValueByPrefix } from '../utils';
import { getAnnotations, getLabels } from '../selectors';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { getDataVolumeStorageSize, getDataVolumeStorageClassName } from '../dv/selectors';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { getDiskBus } from './disk';
import {
  getVolumeContainerImage,
  getVolumePersistentVolumeClaimName,
  getVolumeCloudInitNoCloud,
} from './volume';
import { vCPUCount } from './cpu';
import { getVMIDisks } from '../vmi/basic';
import { VirtualMachineModel } from '../../models';
import { V1Volume } from '../../types/vm/disk/V1Volume';
import { VMGenericLikeEntityKind, VMILikeEntityKind } from '../../types/vmLike';

export const getMemory = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.resources.requests.memory');
export const getCPU = (vm: VMKind): CPURaw => _.get(vm, 'spec.template.spec.domain.cpu');
export const getResourcesRequestsCPUCount = (vm: VMKind): string =>
  vm?.spec?.template?.spec?.domain?.resources?.requests?.cpu;
export const getResourcesLimitsCPUCount = (vm: VMKind): string =>
  vm?.spec?.template?.spec?.domain?.resources?.limits?.cpu;
export const isDedicatedCPUPlacement = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.cpu.dedicatedCpuPlacement');
export const getDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  _.get(vm, 'spec.template.spec.domain.devices.disks') == null
    ? defaultValue
    : vm.spec.template.spec.domain.devices.disks;
export const getInterfaces = (
  vm: VMKind,
  defaultValue: V1NetworkInterface[] = [],
): V1NetworkInterface[] =>
  _.get(vm, 'spec.template.spec.domain.devices.interfaces') == null
    ? defaultValue
    : vm.spec.template.spec.domain.devices.interfaces;

export const getNetworks = (vm: VMKind, defaultValue: V1Network[] = []): V1Network[] =>
  _.get(vm, 'spec.template.spec.networks') == null ? defaultValue : vm.spec.template.spec.networks;
export const getVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  _.get(vm, 'spec.template.spec.volumes') == null ? defaultValue : vm.spec.template.spec.volumes;
export const getDataVolumeTemplates = (vm: VMKind, defaultValue = []) =>
  _.get(vm, 'spec.dataVolumeTemplates') == null ? defaultValue : vm.spec.dataVolumeTemplates;

export const getOperatingSystem = (vmLike: VMGenericLikeEntityKind): string =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_OS_LABEL);
export const getOperatingSystemName = (vmLike: VMGenericLikeEntityKind) =>
  getValueByPrefix(
    getAnnotations(vmLike),
    `${TEMPLATE_OS_NAME_ANNOTATION}/${getOperatingSystem(vmLike)}`,
  );

export const getWorkloadProfile = (vm: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vm), TEMPLATE_WORKLOAD_LABEL);
export const getFlavor = (vmLike: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_FLAVOR_LABEL);

export const isVMRunning = (value: VMKind) =>
  (_.get(value, 'spec.runStrategy', null) === null &&
    _.get(value, 'spec.running', null) === true) ||
  (_.get(value, 'spec.running', null) === null &&
    _.get(value, 'spec.runStrategy', null) !== 'Halted');

export const isVMReady = (value: VMKind) =>
  _.get(value, 'status.ready', false) as VMKind['status']['ready'];

export const isVMCreated = (value: VMKind) =>
  _.get(value, 'status.created', false) as VMKind['status']['created'];

export const getVmPreferableDiskBus = (vm: VMKind) =>
  getDisks(vm)
    .map((disk) => getDiskBus(disk))
    .find((bus) => bus) || BUS_VIRTIO;

export const getUsedNetworks = (vm: VMKind): NetworkWrapper[] => {
  const interfaces = getInterfaces(vm);
  const networkLookup = createBasicLookup<any>(getNetworks(vm), getSimpleName);

  return interfaces
    .map((i) => NetworkWrapper.initialize(networkLookup[i.name]))
    .filter((i) => i.getType());
};

export const getFlavorDescription = (vm: VMKind) => {
  const cpu = vCPUCount(getCPU(vm));
  const memory = getMemory(vm);
  const cpuStr = cpu ? `${cpu} CPU` : '';
  const memoryStr = memory ? `${memory} Memory` : '';
  const resourceStr = cpuStr && memoryStr ? `${cpuStr}, ${memoryStr}` : `${cpuStr}${memoryStr}`;
  return resourceStr || undefined;
};

export const getVMStatusConditions = (vm: VMILikeEntityKind) =>
  _.get(vm, 'status.conditions', []) as VMKind['status']['conditions'];

export const getCloudInitVolume = (vm: VMKind) => {
  const cloudInitVolume = getVolumes(vm).find(getVolumeCloudInitNoCloud);

  if (cloudInitVolume) {
    // make sure volume is used by disk
    const disks = getDisks(vm);
    if (disks.find((disk) => disk.name === cloudInitVolume.name)) {
      return cloudInitVolume;
    }
  }
  return null;
};

export const hasAutoAttachPodInterface = (vm: VMKind, defaultValue = false) =>
  _.get(vm, 'spec.template.spec.domain.devices.autoattachPodInterface', defaultValue);

export const getCDRoms = (vm: VMILikeEntityKind) =>
  vm.kind === VirtualMachineModel.kind
    ? getDisks(vm as VMKind).filter((device) => !!device.cdrom)
    : getVMIDisks(vm as VMIKind).filter((device) => !!device.cdrom);

export const getContainerImageByDisk = (vm: VMKind, name: string) =>
  getVolumeContainerImage(getVolumes(vm).find((vol) => name === vol.name));

export const getPVCSourceByDisk = (vm: VMKind, diskName: string) =>
  getVolumePersistentVolumeClaimName(getVolumes(vm).find((vol) => vol.name === diskName));

export const getURLSourceByDisk = (vm: VMKind, name: string) => {
  const dvTemplate = getDataVolumeTemplates(vm).find((vol) => getName(vol).includes(name));
  return (
    dvTemplate &&
    dvTemplate.spec &&
    dvTemplate.spec.source &&
    dvTemplate.spec.source.http &&
    dvTemplate.spec.source.http.url
  );
};

export const getStorageSizeByDisk = (vm: VMKind, diskName: string) =>
  getDataVolumeStorageSize(
    getDataVolumeTemplates(vm).find((vol) => getName(vol).includes(diskName)),
  );

export const getStorageClassNameByDisk = (vm: VMKind, diskName: string) =>
  getDataVolumeStorageClassName(
    getDataVolumeTemplates(vm).find((vol) => getName(vol).includes(diskName)),
  );
