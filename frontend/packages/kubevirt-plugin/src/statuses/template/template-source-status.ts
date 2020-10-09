import {
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  VolumeType,
  DataVolumeSourceType,
} from '../../constants';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { VMTemplateWrapper } from '../../k8s/wrapper/vm/vm-template-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { getPvcImportPodName, getPvcUploadPodName } from '../../selectors/pvc/selectors';
import { getParameterValue } from '../../selectors/selectors';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import { GetTemplateSourceStatus, SOURCE_TYPE } from './types';

const supportedDVSources = [
  DataVolumeSourceType.HTTP,
  DataVolumeSourceType.S3,
  DataVolumeSourceType.REGISTRY,
  DataVolumeSourceType.PVC,
];

export const getTemplateSourceStatus: GetTemplateSourceStatus = ({
  template,
  pods,
  pvcs,
  dataVolumes,
}) => {
  if (isCommonTemplate(template)) {
    const baseImageName = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
    const baseImageNs = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);
    if (!baseImageName || !baseImageNs) {
      return null;
    }
    const pvc = pvcs?.find(
      ({ metadata }) =>
        metadata.name === baseImageName &&
        metadata.namespace === baseImageNs &&
        !metadata.deletionTimestamp,
    );
    if (!pvc) {
      return null;
    }
    const dataVolume = dataVolumes?.find(
      ({ metadata }) => metadata.name === baseImageName && metadata.namespace === baseImageNs,
    );

    const podName = getPvcImportPodName(pvc) || getPvcUploadPodName(pvc);

    const pod = pods.find(
      ({ metadata }) => metadata.name === podName && metadata.namespace === pvc.metadata.namespace,
    );

    return {
      source: SOURCE_TYPE.BASE_IMAGE,
      isReady: !dataVolume || dataVolume.status?.phase === 'Succeeded',
      pvc,
      dataVolume,
      pod,
    };
  }

  const vm = new VMTemplateWrapper(template).getVM();

  if (vm.getNetworkInterfaces().some((i) => i.bootOrder === 1)) {
    return {
      source: SOURCE_TYPE.PXE,
      isReady: true,
    };
  }

  const disks = vm.getDisks();
  if (!disks.length) {
    return {
      error: 'No bootable disk found.',
    };
  }
  const bootDisk = disks.find((disk) => disk.bootOrder === 1) || disks[0];
  const volume = vm.getVolumes().find((vol) => vol.name === bootDisk.name);
  if (!volume) {
    return {
      error: 'No Volume has been found.',
    };
  }

  const volumeWrapper = new VolumeWrapper(volume);

  if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
    const dataVolumeTemplates = vm.getDataVolumeTemplates();
    const dataVolumeName = volumeWrapper.getDataVolumeName();
    const dataVolumeTemplate = dataVolumeTemplates?.find(
      ({ metadata }) => metadata.name === dataVolumeName,
    );
    if (dataVolumeTemplate) {
      const dataVolumeWrapper = new DataVolumeWrapper(dataVolumeTemplate);
      return supportedDVSources.includes(dataVolumeWrapper.getType())
        ? {
            source: SOURCE_TYPE.DATA_VOLUME_TEMPLATE,
            isReady: true,
            dvTemplate: dataVolumeWrapper.asResource(),
          }
        : {
            error: 'Source not supported',
          };
    }
    const dataVolume = dataVolumes.find(
      ({ metadata }) =>
        metadata.namespace === template.metadata.namespace &&
        metadata.name === dataVolumeName &&
        !metadata.deletionTimestamp,
    );
    if (!dataVolume) {
      return {
        error: `Datavolume ${dataVolumeName} does not exist.`,
      };
    }
    return {
      source: SOURCE_TYPE.DATA_VOLUME,
      isReady: dataVolume.status?.phase === 'Succeeded',
      dataVolume,
      pvc: pvcs.find(
        ({ metadata }) =>
          metadata.name === dataVolume.metadata.name &&
          metadata.namespace === dataVolume.metadata.namespace,
      ),
    };
  }

  if (volumeWrapper.getType() === VolumeType.PERSISTENT_VOLUME_CLAIM) {
    const pvcName = volumeWrapper.getPersistentVolumeClaimName();
    const pvc = pvcs.find(
      ({ metadata }) =>
        metadata.namespace === template.metadata.namespace &&
        metadata.name === pvcName &&
        !metadata.deletionTimestamp,
    );
    if (!pvc) {
      return {
        error: `Persistent Volume Claim ${pvcName} does not exist.`,
      };
    }
    return {
      source: SOURCE_TYPE.PVC,
      isReady: true,
      pvc,
    };
  }

  if (volumeWrapper.getType() === VolumeType.CONTAINER_DISK) {
    return {
      source: SOURCE_TYPE.CONTAINER,
      container: volumeWrapper.getContainerImage(),
      isReady: true,
    };
  }

  return {
    error: 'Source not supported',
  };
};
