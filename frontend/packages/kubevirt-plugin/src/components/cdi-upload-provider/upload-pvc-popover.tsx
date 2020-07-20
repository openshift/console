import * as React from 'react';
import { getName, getNamespace, ProgressStatus } from '@console/shared';
import { InProgressIcon, ErrorCircleOIcon, BanIcon } from '@patternfly/react-icons';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens';
import {
  Popover,
  PopoverPosition,
  Button,
  Progress,
  ProgressVariant,
  Stack,
  StackItem,
  Spinner,
} from '@patternfly/react-core';
import { UPLOAD_STATUS } from './consts';
import { CDIUploadContext } from './cdi-upload-provider';
import { killUploadPVC } from '../../k8s/requests/cdi-upload/cdi-upload-requests';
import { K8sResourceKind } from '@console/internal/module/k8s';

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

export const UploadPVCPopover: React.FC<PVCUploadStatusProps> = ({ pvc }) => {
  const pvcName = getName(pvc);
  const namespace = getNamespace(pvc);

  const { uploads } = React.useContext(CDIUploadContext);
  const upload = uploads.find((upl) => upl.pvcName === pvcName && upl.namespace === namespace);
  const [error, setError] = React.useState(upload?.uploadError);

  const onCancelClick = () => {
    upload.cancelUpload();
    killUploadPVC(pvcName, namespace).catch(setError);
  };

  React.useEffect(() => {
    setError(upload?.uploadError);
  }, [upload]);

  const getPopoverBody = (status: string) => {
    switch (status) {
      case UPLOAD_STATUS.ERROR:
        return {
          title: `Upload Error`,
          body: error?.message,
          icon: <ErrorCircleOIcon className="co-icon-and-text__icon" color={dangerColor.value} />,
        };
      case UPLOAD_STATUS.CANCELED:
        return {
          title: error ? 'Cancel Error' : 'Upload Canceled',
          body: error ? error?.message : 'Removing Resources',
          icon: (
            <BanIcon className="co-icon-and-text__icon" color={error ? dangerColor.value : ''} />
          ),
        };
      case UPLOAD_STATUS.UPLOADING:
        return {
          title: `Uploading`,
          body: 'Please do not close this window, you can keep navigating the app freely.',
          icon: <InProgressIcon className="co-icon-and-text__icon" />,
        };
      case UPLOAD_STATUS.SUCCESS:
        return {
          title: `Upload Finished`,
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
                  Cancel upload
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
  // no context data, upload is from another session
  return <ProgressStatus title="Uploading" />;
};

type PVCUploadStatusProps = {
  pvc: K8sResourceKind;
};
