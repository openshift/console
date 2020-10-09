import * as React from 'react';
import { ProgressStatus, ErrorStatus } from '@console/shared';
import { Progress, Alert, Stack, StackItem } from '@patternfly/react-core';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { DataVolumeSourceType } from '../../constants/vm';
import { UploadPVCPopover } from '../cdi-upload-provider/upload-pvc-popover';
import { PodKind } from '@console/internal/module/k8s';
import {
  getPodStatus,
  POD_PHASE_PENDING,
  POD_STATUS_ALL_ERROR,
  POD_STATUS_NOT_SCHEDULABLE,
} from '../../statuses/pod';
import { getPodStatusPhase } from '../../selectors/pod/selectors';
import { ResourceLink } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';

enum DV_STATUS {
  PREPARING = 'Preparing PVC',
  IMPORT = 'Importing',
  CLONE = 'Cloning',
  ERROR = 'Error',
}

type DVStatus = {
  type: DV_STATUS;
  message: React.ReactNode;
  progress?: number;
};

const getDVStatus = ({ dataVolume, pod }: DVImportStatusProps): DVStatus => {
  if (!pod) {
    return { type: DV_STATUS.PREPARING, message: 'Starting CDI pod' };
  }
  const podStatus = getPodStatus(pod);
  if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
    const isPending =
      podStatus.status === POD_STATUS_NOT_SCHEDULABLE &&
      getPodStatusPhase(pod) === POD_PHASE_PENDING;
    return {
      type: isPending ? DV_STATUS.PREPARING : DV_STATUS.ERROR,
      message: podStatus.message,
    };
  }
  const dvWrapper = new DataVolumeWrapper(dataVolume);
  const progress = parseInt(dataVolume?.status?.progress, 10);
  switch (dvWrapper.getType()) {
    case DataVolumeSourceType.REGISTRY:
      return {
        type: DV_STATUS.IMPORT,
        message: `Importing container ${dvWrapper.getURL()}`,
        progress,
      };
    case DataVolumeSourceType.HTTP:
    case DataVolumeSourceType.S3:
      return {
        message: (
          <>
            Importing from <a href={dvWrapper.getURL()}>url</a>
          </>
        ),
        progress,
        type: DV_STATUS.IMPORT,
      };
    case DataVolumeSourceType.PVC:
      return {
        message: (
          <>
            Cloning{' '}
            <ResourceLink
              inline
              kind={PersistentVolumeClaimModel.kind}
              name={dvWrapper.getPesistentVolumeClaimName()}
              namespace={dvWrapper.getPesistentVolumeClaimNamespace()}
            />
          </>
        ),
        type: DV_STATUS.CLONE,
        progress,
      };
    default:
      return {
        type: DV_STATUS.IMPORT,
        message: 'Source not supported',
      };
  }
};

export const DVImportStatus: React.FC<DVImportStatusProps> = ({ dataVolume, pod, children }) => {
  const dvWrapper = new DataVolumeWrapper(dataVolume);
  if (dvWrapper.getType() === DataVolumeSourceType.UPLOAD) {
    return <UploadPVCPopover pvc={dataVolume} title="Source uploading" />;
  }

  const { type, message, progress } = getDVStatus({ dataVolume, pod });

  if (type === DV_STATUS.ERROR) {
    return (
      <ErrorStatus title={type}>
        <Stack hasGutter>
          <StackItem>
            <Alert variant="danger" isInline title={message} />
          </StackItem>
          <StackItem>
            <ResourceLink
              kind={PodModel.kind}
              name={pod.metadata.name}
              namespace={pod.metadata.namespace}
            />
          </StackItem>
          {children && <StackItem>{children}</StackItem>}
        </Stack>
      </ErrorStatus>
    );
  }

  return (
    <ProgressStatus title={type}>
      <Stack hasGutter>
        <StackItem>{message}</StackItem>
        {!!progress && (
          <StackItem>
            <Progress value={progress} title={type} />
          </StackItem>
        )}
        {children && <StackItem>{children}</StackItem>}
      </Stack>
    </ProgressStatus>
  );
};

type DVImportStatusProps = {
  dataVolume: V1alpha1DataVolume;
  pod: PodKind;
};
