import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FormGroup, FileUpload, FileUploadProps } from '@patternfly/react-core';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ListKind, PodKind } from '@console/internal/module/k8s';
import { PodModel, SecretModel } from '@console/internal/models';
import { CEPH_STORAGE_NAMESPACE, IP_FAMILY } from '../../../../constants';
import { checkError, getIPFamily } from '../../../ocs-install/external-mode/utils';
import { CanGoToNextStep, RHCSState, CreatePayload, ExternalComponentProps } from '../types';

import './index.scss';

const SCRIPT_NAME = 'ceph-external-cluster-details-exporter.py';

export const ConnectionDetails: React.FC<ExternalComponentProps<RHCSState>> = ({
  setFormState,
  formState,
}) => {
  const [pods, podsLoaded, podsLoadError] = useK8sGet<ListKind<PodKind>>(PodModel);
  const { t } = useTranslation();

  const { ipFamily, fileName, fileData } = formState;

  React.useEffect(() => {
    if (podsLoaded && !podsLoadError && pods?.items?.length) {
      const address: string = pods.items?.[0]?.status?.podIP;
      const ip: IP_FAMILY = address && getIPFamily(address);
      if (address && ipFamily !== ip) {
        setFormState('ipFamily', ipFamily);
      }
    }
  }, [ipFamily, pods, podsLoadError, podsLoaded, setFormState]);

  const downloadFile = 'download-file.py';

  const handleFileChange: FileUploadProps['onChange'] = (value, fName) => {
    setFormState('fileName', fName);
    setFormState('fileData', value as string);
  };

  const handleFileRejected: FileUploadProps['dropzoneProps']['onDropRejected'] = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _rejectedFiles,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event,
  ) => setFormState('isRejected', true);

  const handleFileAccepted: FileUploadProps['dropzoneProps']['onDropAccepted'] = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _acceptedFiles,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event,
  ) => (checkError(fileData, null, null, ipFamily) ? setFormState('isRejected', true) : null);

  return (
    <FormGroup
      label={t('ceph-storage-plugin~External storage metadata')}
      fieldId="external-storage-system-metadata"
      className="odf-connection-details__form-group"
      helperText={
        <div className="odf-connection-details__helper-text">
          <Trans t={t} ns="ceph-storage-plugin">
            Download <code>{{ SCRIPT_NAME }}</code> script and run on the RHCS cluster, then upload
            the results (JSON).
          </Trans>{' '}
          {downloadFile && (
            <a
              id="downloadAnchorElem"
              href={downloadFile}
              download="ceph-external-cluster-details-exporter.py"
              target="_blank"
              rel="noopener noreferrer"
              className=""
            >
              {t('ceph-storage-plugin~Download script')}
            </a>
          )}
        </div>
      }
      helperTextInvalid={t('ceph-storage-plugin~The uploaded file is not a valid JSON file')}
      validated={formState.isRejected ? 'error' : 'default'}
    >
      <FileUpload
        id="external-storage-system-metadata"
        type="text"
        isRequired
        className="odf-connection-details__file-upload"
        browseButtonText={t('ceph-storage-plugin~Browse')}
        filenamePlaceholder={t('ceph-storage-plugin~Upload JSON file')}
        value={fileData}
        filename={fileName}
        onChange={handleFileChange}
        onReadStarted={() => setFormState('isLoading', 'true')}
        onReadFinished={() => setFormState('isLoading', 'false')}
        isLoading={formState.isLoading}
        dropzoneProps={{
          accept: '.json',
          onDropRejected: handleFileRejected,
          onDropAccepted: handleFileAccepted,
        }}
        validated={formState.isRejected ? 'error' : 'default'}
      />
    </FormGroup>
  );
};

export const rhcsPayload: CreatePayload<RHCSState> = (systemName, state, model) => {
  const { apiVersion, apiGroup, kind } = SecretModel;
  return [
    {
      model: {
        group: apiGroup,
        version: apiVersion,
        kind,
      },
      payload: {
        apiVersion: SecretModel.apiVersion,
        kind: SecretModel.kind,
        metadata: {
          name: 'rook-ceph-external-cluster-details',
          namespace: CEPH_STORAGE_NAMESPACE,
        },
        stringData: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          external_cluster_details: state.fileData,
        },
        type: 'Opaque',
      },
    },
    {
      model,
      payload: {
        apiVersion: model.version,
        kind: model.kind,
        metadata: {
          name: systemName,
          namespace: CEPH_STORAGE_NAMESPACE,
        },
        spec: {
          externalStorage: {
            enable: true,
          },
          labelSelector: {
            matchExpressions: [],
          },
        },
      },
    },
  ];
};

export const rhcsCanGoToNextStep: CanGoToNextStep<RHCSState> = (state) =>
  !!state.fileData && !state.isRejected && !state.isLoading;
