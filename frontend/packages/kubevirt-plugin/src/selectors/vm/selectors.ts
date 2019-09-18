import * as _ from 'lodash';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import {
  BUS_VIRTIO,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { V1Network, V1NetworkInterface, VMKind, VMLikeEntityKind, CPURaw } from '../../types';
import { findKeySuffixValue, getSimpleName, getValueByPrefix } from '../utils';
import { getAnnotations, getLabels } from '../selectors';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { getDiskBus } from './disk';
import { getVolumeCloudInitUserData } from './volume';
import { vCPUCount } from './cpu';

export const getMemory = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.resources.requests.memory');
export const getCPU = (vm: VMKind): CPURaw => _.get(vm, 'spec.template.spec.domain.cpu');
export const getDisks = (vm: VMKind, defaultValue = []) =>
  _.get(vm, 'spec.template.spec.domain.devices.disks') == null
    ? defaultValue
    : vm.spec.template.spec.domain.devices.disks;
export const getInterfaces = (vm: VMKind, defaultValue = []): V1NetworkInterface[] =>
  _.get(vm, 'spec.template.spec.domain.devices.interfaces') == null
    ? defaultValue
    : vm.spec.template.spec.domain.devices.interfaces;

export const getNetworks = (vm: VMKind, defaultValue = []): V1Network[] =>
  _.get(vm, 'spec.template.spec.networks') == null ? defaultValue : vm.spec.template.spec.networks;
export const getVolumes = (vm: VMKind, defaultValue = []) =>
  _.get(vm, 'spec.template.spec.volumes') == null ? defaultValue : vm.spec.template.spec.volumes;
export const getDataVolumeTemplates = (vm: VMKind, defaultValue = []) =>
  _.get(vm, 'spec.dataVolumeTemplates') == null ? defaultValue : vm.spec.dataVolumeTemplate;

export const getOperatingSystem = (vm: VMLikeEntityKind) =>
  findKeySuffixValue(getLabels(vm), TEMPLATE_OS_LABEL);
export const getOperatingSystemName = (vm: VMKind) =>
  getValueByPrefix(getAnnotations(vm), `${TEMPLATE_OS_NAME_ANNOTATION}/${getOperatingSystem(vm)}`);
export const getWorkloadProfile = (vm: VMLikeEntityKind) =>
  findKeySuffixValue(getLabels(vm), TEMPLATE_WORKLOAD_LABEL);
export const getFlavor = (vmLike: VMLikeEntityKind) =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_FLAVOR_LABEL);

export const isVMRunning = (value: VMKind) =>
  _.get(value, 'spec.running', false) as VMKind['spec']['running'];

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

export const getVMStatusConditions = (vm: VMKind) =>
  _.get(vm, 'status.conditions', []) as VMKind['status']['conditions'];

export const getCloudInitVolume = (vm: VMKind) => {
  const cloudInitVolume = getVolumes(vm).find(getVolumeCloudInitUserData);

  if (cloudInitVolume) {
    // make sure volume is used by disk
    const disks = getDisks(vm);
    if (disks.find((disk) => disk.name === cloudInitVolume.name)) {
      return cloudInitVolume;
    }
  }
  return null;
};

export const getCloudInitUserData = (vm: VMKind) =>
  getVolumeCloudInitUserData(getCloudInitVolume(vm));

export const hasAutoAttachPodInterface = (vm: VMKind, defaultValue = false) =>
  _.get(vm, 'spec.template.spec.domain.devices.autoattachPodInterface', defaultValue);
