import { PodKind } from '@console/internal/module/k8s';
import { DataVolumeSourceType } from '../../constants';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { getPodStatusPhase } from '../../selectors/pod/selectors';
import { V1alpha1DataVolume } from '../../types/api';
import {
  getPodStatus,
  POD_PHASE_PENDING,
  POD_STATUS_ALL_ERROR,
  POD_STATUS_NOT_SCHEDULABLE,
} from '../pod';

export enum DVStatusType {
  PREPARING = 'Preparing PVC',
  IMPORT = 'Importing',
  CLONE = 'Cloning',
  UPLOAD = 'Uploading',
  ERROR = 'Error',
}

type DVStatus = {
  type: DVStatusType;
  message: string;
  progress?: number;
};

type DVStatusProps = {
  dataVolume: V1alpha1DataVolume;
  pod: PodKind;
};

export const getDVStatus = ({ dataVolume, pod }: DVStatusProps): DVStatus => {
  if (!pod) {
    return { type: DVStatusType.PREPARING, message: 'Starting CDI pod' };
  }
  const podStatus = getPodStatus(pod);
  if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
    const isPending =
      podStatus.status === POD_STATUS_NOT_SCHEDULABLE &&
      getPodStatusPhase(pod) === POD_PHASE_PENDING;
    return {
      type: isPending ? DVStatusType.PREPARING : DVStatusType.ERROR,
      message: podStatus.message,
    };
  }
  const dvWrapper = new DataVolumeWrapper(dataVolume);
  const progress = parseInt(dataVolume?.status?.progress, 10);
  switch (dvWrapper.getType()) {
    case DataVolumeSourceType.REGISTRY:
      return {
        type: DVStatusType.IMPORT,
        message: 'This operating system boot source is currently importing',
        progress,
      };
    case DataVolumeSourceType.HTTP:
    case DataVolumeSourceType.S3:
      return {
        progress,
        type: DVStatusType.IMPORT,
        message: 'This operating system boot source is currently importing',
      };
    case DataVolumeSourceType.PVC:
      return {
        type: DVStatusType.CLONE,
        message: 'This operating system boot source is currently being cloned',
        progress,
      };
    case DataVolumeSourceType.UPLOAD:
      return {
        type: DVStatusType.UPLOAD,
        message: 'This operating system boot source is currently being uploaded',
        progress,
      };
    default:
      return {
        type: DVStatusType.ERROR,
        message: 'Source not supported',
      };
  }
};
