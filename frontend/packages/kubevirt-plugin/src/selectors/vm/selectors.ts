import * as _ from 'lodash';
import { getName } from '@console/shared/src/selectors/common';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { CPURaw, V1Network, V1NetworkInterface, VMKind } from '../../types';
import { findKeySuffixValue, getSimpleName, getValueByPrefix } from '../utils';
import { getAnnotations, getLabels } from '../selectors';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { getDataVolumeStorageClassName, getDataVolumeStorageSize } from '../dv/selectors';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import {
  getVolumeCloudInitNoCloud,
  getVolumeContainerImage,
  getVolumePersistentVolumeClaimName,
} from './volume';
import { V1Volume } from '../../types/vm/disk/V1Volume';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { RunStrategy, StateChangeRequest } from '../../constants/vm/vm';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';

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
export const getDataVolumeTemplates = (vm: VMKind, defaultValue = []): V1alpha1DataVolume[] =>
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

export const getWorkloadProfile = (vm: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vm), TEMPLATE_WORKLOAD_LABEL);
export const getFlavor = (vmLike: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_FLAVOR_LABEL);

export const isVMReady = (vm: VMKind) => !!vm?.status?.ready;

export const isVMCreated = (vm: VMKind) => !!vm?.status?.created;

export const isVMExpectedRunning = (vm: VMKind) => {
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
      case RunStrategy.RerunOnFailure:
        return true;
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

export const isVMRunningOrExpectedRunning = (vm: VMKind) => {
  return isVMCreated(vm) || isVMExpectedRunning(vm);
};

export const getUsedNetworks = (vm: VMKind): NetworkWrapper[] => {
  const interfaces = getInterfaces(vm);
  const networkLookup = createBasicLookup<any>(getNetworks(vm), getSimpleName);

  return interfaces
    .map((i) => new NetworkWrapper(networkLookup[i.name]))
    .filter((i) => i.getType());
};

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

export const getNodeSelector = (vm: VMKind) => vm?.spec?.template?.spec?.nodeSelector;

export const getTolerations = (vm: VMKind) => vm?.spec?.template?.spec?.tolerations;

export const getAffinity = (vm: VMKind) => vm?.spec?.template?.spec?.affinity;

export const getIsGraphicsConsoleAttached = (vm: VMKind) =>
  vm?.spec?.template?.spec?.domain?.devices?.autoattachGraphicsDevice;

export const getIsSerialConsoleAttached = (vm: VMKind) =>
  vm?.spec?.template?.spec?.domain?.devices?.autoattachSerialConsole;
