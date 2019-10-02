import * as _ from 'lodash';
import { isWindows } from 'kubevirt-web-ui-components';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import {
  BUS_VIRTIO,
  NetworkType,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { VMKind, VMLikeEntityKind, CPURaw } from '../../types';
import { findKeySuffixValue, getValueByPrefix } from '../utils';
import { getAnnotations, getLabels } from '../selectors';
import {
  getVolumeContainerImageName,
  getVolumePersistentVolumeClaimName,
  getVolumeCloudInitUserData,
} from './volume';
import { getDiskBus } from './disk';
import { getNicBus } from './nic';
import { Network } from './types';
import { vCPUCount } from './cpu';

export const getMemory = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.resources.requests.memory');
export const getCPU = (vm: VMKind): CPURaw => _.get(vm, 'spec.template.spec.domain.cpu');
export const getDisks = (vm: VMKind) => _.get(vm, 'spec.template.spec.domain.devices.disks', []);
export const getInterfaces = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.devices.interfaces') || [];

export const getNetworks = (vm: VMKind) => _.get(vm, 'spec.template.spec.networks') || [];
export const getVolumes = (vm: VMKind) => _.get(vm, 'spec.template.spec.volumes') || [];
export const getDataVolumeTemplates = (vm: VMKind) => _.get(vm, 'spec.dataVolumeTemplates') || [];

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

export const getVmPreferableNicBus = (vm: VMKind) =>
  getNetworks(vm)
    .map((nic) => getNicBus(nic))
    .find((bus) => bus) || BUS_VIRTIO;

export const getUsedNetworks = (vm: VMKind): Network[] => {
  const interfaces = getInterfaces(vm);
  const networkLookup = createBasicLookup<any>(getNetworks(vm), (network) =>
    _.get(network, 'name'),
  );

  return interfaces
    .map((i) => {
      const network = networkLookup[i.name];
      if (_.get(network, 'multus')) {
        return {
          networkType: NetworkType.MULTUS,
          name: network.multus.networkName,
        };
      }
      if (_.get(network, 'pod')) {
        return { name: network.name, networkType: NetworkType.POD };
      }
      return null;
    })
    .filter((i) => i);
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
export const getCDRoms = (vm: VMKind) => getDisks(vm).filter((device) => !!device.cdrom);

export const getContainerImageByDisk = (vm: VMKind, name: string) =>
  getVolumeContainerImageName(getVolumes(vm).find((vol) => name === vol.name));

export const getURLSourceByDisk = (vm: VMKind, name: string) =>
  _.get(
    getDataVolumeTemplates(vm).find((vol) => vol.metadata.name.includes(name)),
    'spec.source.http.url',
  );

export const getWindowsToolsURLByDisk = (vm: VMKind, name: string) =>
  isWindows(vm) ? getURLSourceByDisk(vm, name) : null;

export const getPVCSourceByDisk = (vm: VMKind, cdName: string) =>
  getVolumePersistentVolumeClaimName(getVolumes(vm).find((vol) => vol.name === cdName));
