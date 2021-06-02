import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CDIUploadContext } from './cdi-upload-provider';
import { UPLOAD_STATUS } from './consts';

export const PVCAlertExtension: React.FC<PVCAlertExtension> = ({ pvc }) => {
  const { uploads } = React.useContext(CDIUploadContext);
  const upload = uploads.find(
    (upl) => upl.pvcName === pvc?.metadata?.name && upl.namespace === pvc?.metadata?.namespace,
  );
  const isUploading = upload?.uploadStatus === UPLOAD_STATUS.UPLOADING;
  return (
    isUploading && (
      <Alert
        className="co-m-form-row"
        isInline
        variant={AlertVariant.warning}
        title="Please don't close this browser tab"
      >
        Closing it will cause the upload to fail. You may still navigate the console.
      </Alert>
    )
  );
};

type PVCAlertExtension = {
  pvc: K8sResourceKind;
};
