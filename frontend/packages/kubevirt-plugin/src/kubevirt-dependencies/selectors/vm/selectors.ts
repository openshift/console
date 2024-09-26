import * as _ from 'lodash';
import { VMStatus } from '../../constants/vm-status';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm/constants';
import { RunStrategy, StateChangeRequest } from '../../constants/vm/vm';
import { VMIPhase } from '../../constants/vmi-phase';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { V1Disk, V1GPU, V1HostDevice, V1Volume } from '../../types/api';
import {
  CPURaw,
  Devices,
  V1DataVolumeTemplateSpec,
  V1Network,
  V1NetworkInterface,
  VMKind,
} from '../../types/vm';
import { VMGenericLikeEntityKind } from '../../types/vm-like';
import { VMIKind } from '../../types/vmi';
import { createBasicLookup, findKeySuffixValue, getSimpleName } from '../../utils/utils';
import { getAnnotations, getLabels, getStatusPhase } from '../k8sCommon';
import { getValueByPrefix } from '../selectors';
import { getVolumeCloudInitNoCloud } from './volume';

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

export const getDevices = (vm: VMKind, defaultValue: Devices = {}): Devices =>
  vm?.spec?.template?.spec?.domain?.devices
    ? _.pick(vm.spec.template.spec.domain.devices, ['disks', 'interfaces'])
    : defaultValue;

export const getGPUDevices = (vm: VMKind, defaultValue: V1GPU[] = []): V1GPU[] =>
  vm?.spec?.template?.spec?.domain?.devices?.gpus || defaultValue;

export const getHostDevices = (vm: VMKind, defaultValue: V1HostDevice[] = []): V1HostDevice[] =>
  vm?.spec?.template?.spec?.domain?.devices?.hostDevices || defaultValue;

export const getNetworks = (vm: VMKind, defaultValue: V1Network[] = []): V1Network[] =>
  _.get(vm, 'spec.template.spec.networks') == null ? defaultValue : vm.spec.template.spec.networks;

export const getVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  _.get(vm, 'spec.template.spec.volumes') == null ? defaultValue : vm.spec.template.spec.volumes;

export const getDataVolumeTemplates = (
  vm: VMKind,
  defaultValue: V1DataVolumeTemplateSpec[] = [],
): V1DataVolumeTemplateSpec[] =>
  _.get(vm, 'spec.dataVolumeTemplates') == null ? defaultValue : vm.spec.dataVolumeTemplates;

export const getBootableDisks = (vm: VMKind, disks?: V1Disk[], volumes?: V1Volume[]): V1Disk[] => {
  const volumeLookup = createBasicLookup(volumes || getVolumes(vm), getSimpleName);
  return (disks || getDisks(vm)).filter((disk) => {
    const volWrapper = new VolumeWrapper(volumeLookup[disk.name]);
    return !volWrapper.isEmpty() && volWrapper.getType() && !volWrapper.getType().isEnvType();
  });
};

export const getOperatingSystem = (vmLike: VMGenericLikeEntityKind): string =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_OS_LABEL);

export const getOperatingSystemName = (vmLike: VMGenericLikeEntityKind) =>
  getValueByPrefix(
    getAnnotations(vmLike),
    `${TEMPLATE_OS_NAME_ANNOTATION}/${getOperatingSystem(vmLike)}`,
  );

export const getNodeSelector = (vm: VMKind) => vm?.spec?.template?.spec?.nodeSelector;

export const getTolerations = (vm: VMKind) => vm?.spec?.template?.spec?.tolerations;

export const getAffinity = (vm: VMKind) => vm?.spec?.template?.spec?.affinity;

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

export const getFlavor = (vmLike: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_FLAVOR_LABEL);

export const getMemory = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.resources.requests.memory');

export const getCPU = (vm: VMKind): CPURaw => _.get(vm, 'spec.template.spec.domain.cpu');

export const getWorkloadProfile = (vm: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vm), TEMPLATE_WORKLOAD_LABEL);

export const isVMIReady = (vmi: VMIKind) => getStatusPhase(vmi) === VMIPhase.Running;

export const isVMCreated = (vm: VMKind) => !!vm?.status?.created;

export const isVMExpectedRunning = (vm: VMKind, vmi: VMIKind) => {
  if (!vm?.spec) {
    return false;
  }
  const { running, runStrategy } = vm.spec;

  if (running != null) {
    return running;
  }

  if (runStrategy != null) {
    let changeRequests;
    switch (runStrategy as RunStrategy) {
      case RunStrategy.Halted:
        return false;
      case RunStrategy.Always:
        return true;
      case RunStrategy.RerunOnFailure:
        return getStatusPhase<VMIPhase>(vmi) !== VMIPhase.Succeeded;
      case RunStrategy.Manual:
      default:
        changeRequests = new Set(
          (vm.status?.stateChangeRequests || []).map((chRequest) => chRequest?.action),
        );

        if (changeRequests.has(StateChangeRequest.Stop)) {
          return false;
        }
        if (changeRequests.has(StateChangeRequest.Start)) {
          return true;
        }

        return isVMCreated(vm); // if there is no change request we can assume created is representing running (current and expected)
    }
  }
  return false;
};

export const isStoppedFromConsole = (vm: VMKind, vmi: VMIKind) => {
  return (
    vm &&
    isVMCreated(vm) &&
    getStatusPhase(vmi) === VMIPhase.Succeeded &&
    vm.status.printableStatus === VMStatus.STOPPED.getSimpleLabel()
  );
};

export const isVMRunningOrExpectedRunning = (vm: VMKind, vmi: VMIKind) => {
  if (isStoppedFromConsole(vm, vmi)) {
    return false;
  }
  if (isVMExpectedRunning(vm, vmi)) {
    return true;
  }
  if (
    (vm?.spec?.runStrategy as RunStrategy) === RunStrategy.RerunOnFailure &&
    getStatusPhase<VMIPhase>(vmi) === VMIPhase.Succeeded
  ) {
    return false;
  }
  return isVMCreated(vm);
};
