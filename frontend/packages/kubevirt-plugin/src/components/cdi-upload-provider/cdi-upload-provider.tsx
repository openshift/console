import * as React from 'react';
import axios, { Canceler } from 'axios';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CDIConfigModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getUploadProxyURL } from '../../selectors/cdi';
import { CDI_UPLOAD_URL_BUILDER, UPLOAD_STATUS } from './consts';

const resource: WatchK8sResource = {
  kind: kubevirtReferenceForModel(CDIConfigModel),
  isList: false,
  namespaced: false,
  name: 'config',
};

export const CDIUploadContext = React.createContext<CDIUploadContextProps>({
  uploads: [],
  uploadData: () => {},
});

export const CDIUploadProvider = CDIUploadContext.Provider;

export const useCDIUploadHook = (): CDIUploadContextProps => {
  const [cdiConfig, configLoaded, configError] = useK8sWatchResource<K8sResourceKind>(resource);
  const [uploads, setUploads] = React.useState<DataUpload[]>([]);
  const canUpdateState = React.useRef(true);
  const uploadProxyURL = getUploadProxyURL(cdiConfig);

  const updateUpload = (changedUpload: DataUpload) => {
    if (canUpdateState.current) {
      canUpdateState.current = false;

      setUploads((prevUploads) => {
        const rest = prevUploads.filter(
          (upl) =>
            upl.pvcName !== changedUpload.pvcName || upl.namespace !== changedUpload.namespace,
        );

        return [...rest, changedUpload];
      });
    }
  };

  const uploadData = ({ file, token, pvcName, namespace }: UploadDataProps) => {
    const { CancelToken } = axios;
    const cancelSource = CancelToken.source();
    const noRouteFound = configError || !configLoaded || !uploadProxyURL;

    const newUpload: DataUpload = {
      pvcName,
      namespace,
      progress: 0,
      fileName: file?.name,
      cancelUpload: cancelSource.cancel,
      uploadError: noRouteFound && { message: `No Upload URL found ${configError}` },
      uploadStatus: noRouteFound ? UPLOAD_STATUS.ERROR : UPLOAD_STATUS.UPLOADING,
    };

    if (noRouteFound) {
      updateUpload(newUpload);
    } else {
      const form = new FormData();
      form.append('file', file);

      axios({
        method: 'POST',
        url: CDI_UPLOAD_URL_BUILDER(uploadProxyURL),
        data: form,
        cancelToken: cancelSource.token,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (e) => {
          updateUpload({ ...newUpload, progress: Math.floor((e.loaded / file.size) * 100) });
        },
      })
        .then(() => {
          updateUpload({
            ...newUpload,
            progress: 100,
            uploadStatus: UPLOAD_STATUS.SUCCESS,
          });
        })
        .catch((err) => {
          if (axios.isCancel(err)) {
            updateUpload({
              ...newUpload,
              uploadStatus: UPLOAD_STATUS.CANCELED,
            });
          } else {
            updateUpload({
              ...newUpload,
              uploadStatus: UPLOAD_STATUS.ERROR,
              uploadError: { message: `${err.message}: ${err.response?.data}` },
            });
          }
        });
    }
  };

  // multiple uploads could cause abuse of setUploads, so we use a Ref until state finished updating.
  React.useEffect(() => {
    if (!canUpdateState.current) {
      canUpdateState.current = true;
    }
  }, [uploads]);

  return {
    uploads,
    uploadData,
    uploadProxyURL,
  };
};

export type DataUpload = {
  pvcName: string;
  namespace: string;
  fileName?: string;
  progress?: number;
  uploadStatus?: UPLOAD_STATUS;
  uploadError?: any;
  cancelUpload?: Canceler;
};

export type CDIUploadContextProps = {
  uploads: DataUpload[];
  uploadData: ({ file, token, pvcName, namespace }: UploadDataProps) => void;
  uploadProxyURL?: string;
};

type UploadDataProps = {
  file: File;
  token: string;
  pvcName: string;
  namespace: string;
};
