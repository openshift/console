import * as React from 'react';
import { Alert, Progress, ProgressSize, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';
import { ErrorStatus, ProgressStatus } from '@console/shared';
import { DataVolumeSourceType } from '../../constants/vm';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { DVStatusType, getDVStatus } from '../../statuses/dv/dv-status';
import { V1alpha1DataVolume } from '../../types/api';
import { UploadPVCPopover } from '../cdi-upload-provider/upload-pvc-popover';

export const DVImportStatus: React.FC<DVImportStatusProps> = ({ dataVolume, pod, children }) => {
  const { t } = useTranslation();
  const dvWrapper = new DataVolumeWrapper(dataVolume);
  if (dvWrapper.getType() === DataVolumeSourceType.UPLOAD) {
    return (
      <UploadPVCPopover
        pvc={{ metadata: { ...dataVolume?.metadata } }}
        title={t('kubevirt-plugin~Source uploading')}
      />
    );
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
