import * as React from 'react';
import { ProgressStatus, ErrorStatus } from '@console/shared';
import { Progress, Alert, Stack, StackItem, ProgressSize } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';

import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { DataVolumeSourceType } from '../../constants/vm';
import { UploadPVCPopover } from '../cdi-upload-provider/upload-pvc-popover';
import { DVStatusType, getDVStatus } from '../../statuses/dv/dv-status';

export const DVImportStatus: React.FC<DVImportStatusProps> = ({ dataVolume, pod, children }) => {
  const dvWrapper = new DataVolumeWrapper(dataVolume);
  if (dvWrapper.getType() === DataVolumeSourceType.UPLOAD) {
    return <UploadPVCPopover pvc={dataVolume} title="Source uploading" />;
  }

  const { type, message, progress } = getDVStatus({ dataVolume, pod });

  if (type === DVStatusType.ERROR) {
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
        <StackItem className="text-secondary">{message}</StackItem>
        {!!progress && (
          <StackItem>
            <Progress
              value={progress}
              title={`source ${type.toLowerCase()}`}
              size={ProgressSize.sm}
            />
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
