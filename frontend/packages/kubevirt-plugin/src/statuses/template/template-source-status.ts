import { K8sResourceCommon, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { getCreationTimestamp } from '@console/shared';
import {
  ANNOTATION_SOURCE_PROVIDER,
  BOOT_SOURCE_AVAILABLE,
  DataVolumeSourceType,
  LABEL_CDROM_SOURCE,
  NetworkType,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  TEMPLATE_PROVIDER_ANNOTATION,
  VolumeType,
} from '../../constants';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { VMTemplateWrapper } from '../../k8s/wrapper/vm/vm-template-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { getPvcImportPodName, getPvcUploadPodName } from '../../selectors/pvc/selectors';
import { getAnnotation, getParameterValue } from '../../selectors/selectors';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import { V1alpha1DataVolume } from '../../types/api';
import { DVStatusType, getDVStatus } from '../dv/dv-status';
import { GetTemplateSourceStatus, SOURCE_TYPE } from './types';

const supportedDVSources = [
  DataVolumeSourceType.HTTP,
  DataVolumeSourceType.S3,
  DataVolumeSourceType.REGISTRY,
  DataVolumeSourceType.PVC,
];

const getProvider = (resource: K8sResourceCommon): string => {
  const provider = getAnnotation(resource, ANNOTATION_SOURCE_PROVIDER);
  return provider ?? BOOT_SOURCE_AVAILABLE;
};

const isCDRom = (dataVolume: V1alpha1DataVolume, pvc: PersistentVolumeClaimKind) =>
  (dataVolume || pvc)?.metadata?.labels?.[LABEL_CDROM_SOURCE] === 'true';

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

    const addedOn = getCreationTimestamp(dataVolume);

    if (dataVolume && pod) {
      const dvStatus = getDVStatus({ dataVolume, pod });
      if (dvStatus?.type === DVStatusType.ERROR) {
        return {
          error: dvStatus.message,
          pod,
          alert: true,
          pvc,
          dataVolume,
          addedOn,
        };
      }
    }

    const provider = getProvider(pvc);

    return {
      source: SOURCE_TYPE.BASE_IMAGE,
      provider: provider === BOOT_SOURCE_AVAILABLE ? getProvider(dataVolume) : provider,
      isReady: !dataVolume || dataVolume.status?.phase === 'Succeeded',
      pvc,
      dataVolume,
      pod,
      isCDRom: isCDRom(dataVolume, pvc),
      addedOn,
    };
  }

  const customTemplateProvider =
    getAnnotation(template, TEMPLATE_PROVIDER_ANNOTATION) || BOOT_SOURCE_AVAILABLE;

  const vm = new VMTemplateWrapper(template).getVM();

  const networkInterface = vm.getNetworkInterfaces().find((i) => i.bootOrder === 1);

  if (networkInterface) {
    const network = vm.getNetworks().find((n) => n.name === networkInterface.name);
    if (!network) {
      return {
        error: 'No bootable network interface found.',
      };
    }
    const wrapper = new NetworkWrapper(network);
    return wrapper.getType() === NetworkType.MULTUS
      ? {
          source: SOURCE_TYPE.PXE,
          provider: customTemplateProvider,
          isReady: true,
          isCDRom: false,
          pxe: wrapper.getMultusNetworkName(),
          addedOn: getCreationTimestamp(template),
        }
      : {
          error: 'No bootable network interface found.',
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
            provider: customTemplateProvider,
            isReady: true,
            dvTemplate: dataVolumeWrapper.asResource(),
            isCDRom: isCDRom(dataVolumeWrapper.asResource(), null),
            addedOn: getCreationTimestamp(template),
          }
        : {
            error: 'Source not supported.',
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
    const pvc = pvcs.find(
      ({ metadata }) =>
        metadata.name === dataVolume.metadata.name &&
        metadata.namespace === dataVolume.metadata.namespace,
    );
    return {
      source: SOURCE_TYPE.DATA_VOLUME,
      provider: customTemplateProvider,
      isReady: dataVolume.status?.phase === 'Succeeded',
      dataVolume,
      pvc,
      isCDRom: isCDRom(dataVolume, pvc),
      addedOn: getCreationTimestamp(dataVolume),
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
      provider: customTemplateProvider,
      isReady: true,
      pvc,
      isCDRom: isCDRom(null, pvc),
      addedOn: getCreationTimestamp(pvc),
    };
  }

  if (volumeWrapper.getType() === VolumeType.CONTAINER_DISK) {
    return {
      source: SOURCE_TYPE.CONTAINER,
      provider: customTemplateProvider,
      container: volumeWrapper.getContainerImage(),
      isReady: true,
      isCDRom: false,
      addedOn: getCreationTimestamp(template),
    };
  }

  return {
    error: 'Source not supported.',
  };
};
