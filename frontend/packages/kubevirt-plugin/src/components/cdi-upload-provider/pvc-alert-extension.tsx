import * as React from 'react';
import { getName, getNamespace } from '@console/shared';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { UPLOAD_STATUS } from './consts';
import { CDIUploadContext } from './cdi-upload-provider';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const PVCAlertExtension: React.FC<PVCAlertExtension> = ({ pvc }) => {
  const { uploads } = React.useContext(CDIUploadContext);
  const upload = uploads.find(
    (upl) => upl.pvcName === getName(pvc) && upl.namespace === getNamespace(pvc),
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
