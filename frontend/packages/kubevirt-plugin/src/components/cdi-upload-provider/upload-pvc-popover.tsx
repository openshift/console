import * as React from 'react';
import {
  Button,
  Popover,
  PopoverPosition,
  Progress,
  ProgressVariant,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { InProgressIcon, ErrorCircleOIcon, BanIcon } from '@patternfly/react-icons';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ProgressStatus } from '@console/shared';
import { killUploadPVC } from '../../k8s/requests/cdi-upload/cdi-upload-requests';
import { CDIUploadContext } from './cdi-upload-provider';
import { UPLOAD_STATUS } from './consts';

export const getProgressVariant = (status: UPLOAD_STATUS) => {
  switch (status) {
    case UPLOAD_STATUS.ERROR:
      return ProgressVariant.danger;
    case UPLOAD_STATUS.SUCCESS:
      return ProgressVariant.success;
    default:
      return null;
  }
};

export const UploadPVCPopover: React.FC<PVCUploadStatusProps> = ({ pvc, title = 'Uploading' }) => {
  const { t } = useTranslation();
  const { uploads } = React.useContext(CDIUploadContext);
  const upload = uploads.find(
    (upl) => upl.pvcName === pvc?.metadata?.name && upl.namespace === pvc?.metadata?.namespace,
  );
  const [error, setError] = React.useState(upload?.uploadError);

  const onCancelClick = () => {
    upload && upload.cancelUpload();
    killUploadPVC(pvc?.metadata?.name, pvc?.metadata?.namespace).catch(setError);
  };

  const onErrorDeleteSource = () =>
    killUploadPVC(pvc?.metadata?.name, pvc?.metadata?.namespace).catch(setError);

  React.useEffect(() => {
    setError(upload?.uploadError);
  }, [upload]);

  const getPopoverBody = (status: string) => {
    switch (status) {
      case UPLOAD_STATUS.ERROR:
        return {
          title: t('kubevirt-plugin~Upload Error'),
          body: error?.message,
          icon: <ErrorCircleOIcon className="co-icon-and-text__icon" color={dangerColor.value} />,
        };
      case UPLOAD_STATUS.CANCELED:
        return {
          title: error ? t('kubevirt-plugin~Cancel Error') : t('kubevirt-plugin~Upload Canceled'),
          body: error ? error?.message : t('kubevirt-plugin~Removing Resources'),
          icon: (
            <BanIcon className="co-icon-and-text__icon" color={error ? dangerColor.value : ''} />
          ),
        };
      case UPLOAD_STATUS.UPLOADING:
        return {
          title: t('kubevirt-plugin~Uploading'),
          body: t(
            'kubevirt-plugin~Please do not close this window, you can keep navigating the app freely.',
          ),
          icon: <InProgressIcon className="co-icon-and-text__icon" />,
        };
      case UPLOAD_STATUS.SUCCESS:
        return {
          title: t('kubevirt-plugin~Upload Finished'),
          icon: <InProgressIcon className="co-icon-and-text__icon" />,
        };
      default:
        return null;
    }
  };

  if (upload) {
    const uploadPopoverBody = getPopoverBody(upload?.uploadStatus);
    return (
      <Popover
        headerContent={<div>{uploadPopoverBody?.title}</div>}
        position={PopoverPosition.bottom}
        bodyContent={
          <Stack hasGutter>
            <StackItem>
              {upload?.uploadStatus === UPLOAD_STATUS.CANCELED && (
                <Spinner size="md" className="co-icon-and-text__icon" />
              )}
              {uploadPopoverBody?.body}
            </StackItem>
            <StackItem>
              <Progress
                value={upload?.progress}
                title={upload?.fileName}
                variant={getProgressVariant(upload?.uploadStatus)}
              />
            </StackItem>
            {upload?.uploadStatus === UPLOAD_STATUS.UPLOADING && (
              <StackItem>
                <Button
                  id="cdi-upload-cancel-btn"
                  className="pf-m-link--align-left"
                  variant="link"
                  onMouseUp={onCancelClick}
                >
                  {t('kubevirt-plugin~Cancel upload')}
                </Button>
              </StackItem>
            )}
            {upload?.uploadStatus === UPLOAD_STATUS.ERROR && (
              <StackItem>
                <Button
                  id="cdi-upload-delete-btn"
                  className="pf-m-link--align-left"
                  variant="link"
                  onMouseUp={onErrorDeleteSource}
                  isDanger
                >
                  {t('kubevirt-plugin~Delete source')}
                </Button>
              </StackItem>
            )}
          </Stack>
        }
      >
        <Button id="cdi-upload-popover-btn" className="pf-m-link--align-left" variant="link">
          {uploadPopoverBody?.icon}
          {uploadPopoverBody?.title}
        </Button>
      </Popover>
    );
  }
  // no context data, upload is from another sessionc
  return (
    <ProgressStatus title={title}>
      <Button
        id="cdi-upload-cancel-btn"
        className="pf-m-link--align-left"
        variant="link"
        onMouseUp={onCancelClick}
      >
        {t('kubevirt-plugin~Cancel upload')}
      </Button>
    </ProgressStatus>
  );
};

type PVCUploadStatusProps = {
  pvc: K8sResourceKind;
  title?: string;
};
