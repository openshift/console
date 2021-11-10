import * as React from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { FormGroup, FileUpload, FileUploadProps, Form } from '@patternfly/react-core';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { apiVersionForModel, ListKind, PodKind } from '@console/internal/module/k8s';
import { PodModel, SecretModel } from '@console/internal/models';
import { getAnnotations } from '@console/shared/src/selectors/common';
import { K8sKind } from '@console/dynamic-plugin-sdk/src';
import { RHCSState, CanGoToNextStep, CreatePayload, ExternalComponentProps } from '../types';
import { CEPH_STORAGE_NAMESPACE, IP_FAMILY, OCS_OPERATOR } from '../../../../constants';
import {
  checkError,
  createDownloadFile,
  getIPFamily,
  isValidJSON,
  prettifyJSON,
} from '../../../../utils/install';

import './index.scss';
import { ErrorHandler } from '../../error-handler';
import { useFetchCsv } from '../../use-fetch-csv';

const SCRIPT_NAME = 'ceph-external-cluster-details-exporter.py';

export const getValidationKeys = (rawKeys: string): { plainKeys: string[]; secretKeys: [] } => {
  const { configMaps, secrets, storageClasses } = rawKeys
    ? JSON.parse(rawKeys)
    : { configMaps: [], secrets: [], storageClasses: [] };
  const plainKeys = _.concat(configMaps, storageClasses);
  return { plainKeys, secretKeys: secrets };
};

export const ConnectionDetails: React.FC<ExternalComponentProps<RHCSState>> = ({
  setFormState,
  formState,
}) => {
  const { t } = useTranslation();
  const [pods, podsLoaded, podsLoadError] = useK8sGet<ListKind<PodKind>>(PodModel);
  const [csv, csvLoaded, csvLoadError] = useFetchCsv(OCS_OPERATOR, CEPH_STORAGE_NAMESPACE);

  const { fileName, fileData, errorMessage, isLoading } = formState;

  const annotations = getAnnotations(csv);

  const downloadFile = createDownloadFile(
    annotations?.['external.features.ocs.openshift.io/export-script'],
  );

  const handleFileChange: FileUploadProps['onChange'] = (fData: string, fName) => {
    if (isValidJSON(fData)) {
      const { plainKeys, secretKeys } = getValidationKeys(
        annotations?.['external.features.ocs.openshift.io/validation'],
      );
      const ipAddress: string = pods.items?.[0]?.status?.podIP;
      const ipFamily: IP_FAMILY = ipAddress ? getIPFamily(ipAddress) : IP_FAMILY.IPV4;
      const error: string = checkError(fData, plainKeys, secretKeys, ipFamily);
      setFormState('errorMessage', error);
    } else {
      const invalidString: string = t(
        'ceph-storage-plugin~The uploaded file is not a valid JSON file',
      );
      setFormState('errorMessage', fData ? invalidString : '');
    }

    setFormState('fileName', fName);
    setFormState('fileData', fData);
  };

  return (
    <ErrorHandler error={podsLoadError || csvLoadError} loaded={podsLoaded && csvLoaded}>
      <Form>
        <FormGroup
          label={t('ceph-storage-plugin~External storage system metadata')}
          fieldId="external-storage-system-metadata"
          className="odf-connection-details__form-group"
          helperText={
            <div className="odf-connection-details__helper-text">
              <Trans t={t} ns="ceph-storage-plugin">
                Download <code>{{ SCRIPT_NAME }}</code> script and run on the RHCS cluster, then
                upload the results (JSON) in the External storage system metadata field.
              </Trans>{' '}
              {downloadFile && (
                <a
                  id="downloadAnchorElem"
                  href={downloadFile}
                  download="ceph-external-cluster-details-exporter.py"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('ceph-storage-plugin~Download script')}
                </a>
              )}
            </div>
          }
          helperTextInvalid={errorMessage}
          validated={errorMessage ? 'error' : 'default'}
        >
          <FileUpload
            id="external-storage-system-metadata"
            className="odf-connection-details__file-upload"
            type="text"
            isRequired
            isReadOnly
            value={prettifyJSON(fileData ?? '')}
            filename={fileName}
            isLoading={isLoading}
            validated={errorMessage ? 'error' : 'default'}
            dropzoneProps={{
              accept: '.json',
            }}
            onChange={handleFileChange}
            onReadStarted={() => setFormState('isLoading', true)}
            onReadFinished={() => setFormState('isLoading', false)}
            browseButtonText={t('ceph-storage-plugin~Browse')}
            clearButtonText={t('ceph-storage-plugin~Clear')}
            filenamePlaceholder={t('ceph-storage-plugin~Upload helper script')}
          />
        </FormGroup>
      </Form>
    </ErrorHandler>
  );
};

export const rhcsPayload: CreatePayload<RHCSState> = (systemName, state, model) => {
  const { apiVersion, apiGroup, kind, plural } = SecretModel;
  return [
    {
      model: {
        apiGroup,
        apiVersion,
        kind,
        plural,
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
        apiVersion: apiVersionForModel(model as K8sKind),
        apiGroup: model.apiGroup,
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
  !!state.fileName && !!state.fileData && !state.errorMessage && !state.isLoading;
