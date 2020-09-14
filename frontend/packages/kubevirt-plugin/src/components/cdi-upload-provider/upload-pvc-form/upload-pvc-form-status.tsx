import * as React from 'react';
import cx from 'classnames';
import {
  Title,
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  Bullseye,
  Progress,
  Stack,
  StackItem,
  Alert,
  AlertVariant,
  Spinner,
} from '@patternfly/react-core';
import { ErrorCircleOIcon, InProgressIcon } from '@patternfly/react-icons';
import { DataUpload } from '../cdi-upload-provider';
import { getProgressVariant } from '../upload-pvc-popover';
import { killUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import { UPLOAD_STATUS } from '../consts';

export const UploadPVCFormStatus: React.FC<UploadPVCFormStatusProps> = ({
  upload,
  isSubmitting,
  isAllocating,
  allocateError,
  onErrorClick,
  onSuccessClick,
  onCancelFinish,
}) => {
  const [error, setError] = React.useState(allocateError || upload?.uploadError?.message);

  React.useEffect(() => {
    const newError = allocateError || upload?.uploadError?.message;
    setError(newError);
  }, [allocateError, upload]);

  const onCancelClick = () => {
    upload.cancelUpload();
    killUploadPVC(upload?.pvcName, upload?.namespace)
      .then(onCancelFinish)
      .catch((err) => setError(err?.message));
  };

  return (
    <Bullseye
      className={cx({
        'kv--create-upload__hide': !isSubmitting,
      })}
    >
      <EmptyState>
        <DataUploadStatus
          upload={upload}
          error={error}
          isAllocating={isAllocating}
          onErrorClick={onErrorClick}
          onSuccessClick={onSuccessClick}
          onCancelClick={onCancelClick}
        />
      </EmptyState>
    </Bullseye>
  );
};

const DataUploadStatus: React.FC<DataUploadStatus> = ({
  upload,
  error,
  onErrorClick,
  isAllocating,
  onSuccessClick,
  onCancelClick,
}) => {
  if (error) return <ErrorStatus error={error} onErrorPrimaryClick={onErrorClick} />;
  if (isAllocating) return <AllocatingStatus />;
  if (upload?.uploadStatus === UPLOAD_STATUS.CANCELED) return <CancellingStatus />;
  return (
    <UploadingStatus
      upload={upload}
      onSuccessClick={onSuccessClick}
      onCancelClick={onCancelClick}
    />
  );
};

const AllocatingStatus: React.FC = () => (
  <>
    <EmptyStateIcon icon={Spinner} />
    <Title headingLevel="h4" size="lg">
      Allocating Resources
    </Title>
    <EmptyStateBody>
      Please wait, once the Data Volume has been created The data will start uploading into this
      Persistent Volume Claim.
    </EmptyStateBody>
  </>
);

const CancellingStatus: React.FC = () => (
  <>
    <EmptyStateIcon icon={Spinner} />
    <Title headingLevel="h4" size="lg">
      Cancelling Upload
    </Title>
    <EmptyStateBody>Resources are being removed, please wait.</EmptyStateBody>
  </>
);

const ErrorStatus: React.FC<ErrorStatusProps> = ({ error, onErrorPrimaryClick }) => (
  <>
    <EmptyStateIcon icon={ErrorCircleOIcon} color="#cf1010" />
    <Title headingLevel="h4" size="lg">
      Error Uploading Data
    </Title>
    <EmptyStateBody>{error}</EmptyStateBody>
    <Button id="cdi-upload-error-btn" variant="primary" onClick={onErrorPrimaryClick}>
      {error ? 'Back to Form' : 'View Persistent Volume Claim details'}
    </Button>
  </>
);

const UploadingStatus: React.FC<UploadingStatusProps> = ({
  upload,
  onSuccessClick,
  onCancelClick,
}) => (
  <>
    <EmptyStateIcon icon={InProgressIcon} />
    <Title headingLevel="h4" size="lg">
      Uploading data to Persistent Volume Claim
    </Title>
    <EmptyStateBody>
      <Stack hasGutter>
        {upload?.uploadStatus === UPLOAD_STATUS.UPLOADING && (
          <StackItem>
            <Alert
              className="kv--create-upload__alert"
              isInline
              variant={AlertVariant.warning}
              title="Please don’t close this browser tab"
            >
              Closing it will cause the upload to fail. You may still navigate the console.
            </Alert>
          </StackItem>
        )}
        <StackItem>
          Persistent Volume Claim has been created and your data source is now being uploaded to it.
          Once the uploading is completed the Persisten Volume Claim will become available
        </StackItem>
        <StackItem>
          <Progress value={upload?.progress} variant={getProgressVariant(upload?.uploadStatus)} />
        </StackItem>
      </Stack>
    </EmptyStateBody>
    <Button id="cdi-upload-primary-pvc" variant="primary" onClick={onSuccessClick}>
      View Persistent Volume Claim details
    </Button>
    {upload?.uploadStatus === UPLOAD_STATUS.UPLOADING && (
      <EmptyStateSecondaryActions>
        <Button id="cdi-upload-cancel-btn" onClick={onCancelClick} variant="link">
          Cancel Upload
        </Button>
      </EmptyStateSecondaryActions>
    )}
  </>
);

export type UploadPVCStatusProps = {
  upload: DataUpload;
  isSubmitting: boolean;
  isAllocating: boolean;
  allocateError: React.ReactNode;
  onErrorClick: () => void;
  onSuccessClick: () => void;
  onCancelFinish: () => void;
};

export type UploadPVCFormStatusProps = {
  upload: DataUpload;
  isSubmitting: boolean;
  isAllocating: boolean;
  allocateError: React.ReactNode;
  onErrorClick: () => void;
  onSuccessClick: () => void;
  onCancelFinish: () => void;
};

export type DataUploadStatus = {
  error: any;
  upload: DataUpload;
  isAllocating: boolean;
  onErrorClick: () => void;
  onSuccessClick: () => void;
  onCancelClick: () => void;
};

type UploadingStatusProps = {
  upload: DataUpload;
  onSuccessClick: () => void;
  onCancelClick: () => void;
};

type ErrorStatusProps = {
  error: any;
  onErrorPrimaryClick: () => void;
};
