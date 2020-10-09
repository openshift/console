import { K8sResourceCommon, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import {
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  VolumeType,
  DataVolumeSourceType,
  LABEL_CDROM_SOURCE,
  BOOT_SOURCE_COMMUNITY,
  BOOT_SOURCE_USER,
  NetworkType,
} from '../../constants';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { VMTemplateWrapper } from '../../k8s/wrapper/vm/vm-template-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { getPvcImportPodName, getPvcUploadPodName } from '../../selectors/pvc/selectors';
import { getParameterValue } from '../../selectors/selectors';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { GetTemplateSourceStatus, SOURCE_TYPE, TemplateSourceStatusBundle } from './types';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { DVStatusType, getDVStatus } from '../dv/dv-status';

const supportedDVSources = [
  DataVolumeSourceType.HTTP,
  DataVolumeSourceType.S3,
  DataVolumeSourceType.REGISTRY,
  DataVolumeSourceType.PVC,
];

const getProvider = (resource: K8sResourceCommon): TemplateSourceStatusBundle['provider'] =>
  resource?.metadata?.labels?.['kubevirt.io/provided'] // TODO how to detect red hat provided source ?
    ? BOOT_SOURCE_COMMUNITY
    : BOOT_SOURCE_USER;

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

    if (dataVolume && pod) {
      const dvStatus = getDVStatus({ dataVolume, pod });
      if (dvStatus?.type === DVStatusType.ERROR) {
        return {
          error: dvStatus.message,
          pod,
          alert: true,
          pvc,
          dataVolume,
        };
      }
    }

    return {
      source: SOURCE_TYPE.BASE_IMAGE,
      provider: getProvider(pvc),
      isReady: !dataVolume || dataVolume.status?.phase === 'Succeeded',
      pvc,
      dataVolume,
      pod,
      isCDRom: isCDRom(dataVolume, pvc),
    };
  }

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
          provider: BOOT_SOURCE_USER,
          isReady: true,
          isCDRom: false,
          pxe: wrapper.getMultusNetworkName(),
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
            provider: BOOT_SOURCE_USER,
            isReady: true,
            dvTemplate: dataVolumeWrapper.asResource(),
            isCDRom: isCDRom(dataVolumeWrapper.asResource(), null),
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
      provider: getProvider(dataVolume),
      isReady: dataVolume.status?.phase === 'Succeeded',
      dataVolume,
      pvc,
      isCDRom: isCDRom(dataVolume, pvc),
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
      provider: getProvider(pvc),
      isReady: true,
      pvc,
      isCDRom: isCDRom(null, pvc),
    };
  }

  if (volumeWrapper.getType() === VolumeType.CONTAINER_DISK) {
    return {
      source: SOURCE_TYPE.CONTAINER,
      provider: BOOT_SOURCE_USER,
      container: volumeWrapper.getContainerImage(),
      isReady: true,
      isCDRom: false,
    };
  }

  return {
    error: 'Source not supported.',
  };
};
