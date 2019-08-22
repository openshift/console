import { K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import {
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getVolumeDataVolumeName,
  getVolumes,
} from '../vm';
import { ProvisionSource } from '../../types/vm';
import { getDataVolumeSourceType } from '../dv/selectors';
import { DataVolumeSource } from '../../types/dv';
import { selectVM } from './selectors';

export const getTemplateProvisionSource = (
  template: TemplateKind,
  dataVolumes: K8sResourceKind[],
): { type: ProvisionSource; source?: string; error?: string } => {
  const vm = selectVM(template);
  if (getInterfaces(vm).some((i) => i.bootOrder === 1)) {
    return {
      type: ProvisionSource.PXE,
    };
  }
  const bootDisk = getDisks(vm).find((disk) => disk.bootOrder === 1);
  if (bootDisk) {
    const bootVolume = getVolumes(vm).find((volume) => volume.name === bootDisk.name);
    if (bootVolume && bootVolume.containerDisk) {
      return {
        type: ProvisionSource.CONTAINER,
        source: bootVolume.containerDisk.image,
      };
    }
    if (bootVolume && bootVolume.dataVolume) {
      let dataVolume = getDataVolumeTemplates(vm).find(
        (dv) => getName(dv) === getVolumeDataVolumeName(bootVolume),
      );
      if (!dataVolume) {
        dataVolume = dataVolumes.find(
          (d) =>
            getName(d) === getVolumeDataVolumeName(bootVolume) &&
            getNamespace(d) === getNamespace(template),
        );
      }
      if (dataVolume) {
        const source = getDataVolumeSourceType(dataVolume);
        switch (source.type) {
          case DataVolumeSource.URL:
            return {
              type: ProvisionSource.URL,
              source: source.url,
            };
          case DataVolumeSource.PVC:
            return {
              type: ProvisionSource.CLONED_DISK,
              source: `${source.namespace}/${source.name}`,
            };
          case DataVolumeSource.BLANK:
            return {
              type: ProvisionSource.UNKNOWN,
              error: `Datavolume ${bootVolume.dataVolume.name} does not have a supported source (${
                source.type
              }).`,
            };
          case DataVolumeSource.UNKNOWN:
          default:
            return {
              type: ProvisionSource.UNKNOWN,
              error: `Datavolume ${bootVolume.dataVolume.name} does not have a supported source.`,
            };
        }
      } else {
        return {
          type: ProvisionSource.UNKNOWN,
          error: `Datavolume ${bootVolume.dataVolume.name} does not exist.`,
        };
      }
    }
  }
  return {
    type: ProvisionSource.UNKNOWN,
    error: 'No bootable device found.',
  };
};

export const getTemplateStorages = (template: TemplateKind, dataVolumes: K8sResourceKind[]) => {
  const vm = selectVM(template);

  const volumes = getVolumes(vm);
  const dataVolumeTemplates = getDataVolumeTemplates(vm);
  return getDisks(vm).map((disk) => {
    const volume = volumes.find((v) => v.name === disk.name);
    const storage: any = {
      disk,
      volume,
    };
    if (getVolumeDataVolumeName(volume)) {
      storage.dataVolumeTemplate = dataVolumeTemplates.find(
        (d) => getName(d) === getVolumeDataVolumeName(volume),
      );
      storage.dataVolume = dataVolumes.find(
        (d) =>
          getName(d) === getVolumeDataVolumeName(volume) &&
          getNamespace(d) === getNamespace(template),
      );
    }
    return storage;
  });
};
