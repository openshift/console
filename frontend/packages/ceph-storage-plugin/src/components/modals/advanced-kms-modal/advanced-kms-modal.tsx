import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, TextInput, FileUpload, Form } from '@patternfly/react-core';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import {
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils/promise-component';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';

import { State, Action } from '../../ocs-install/attached-devices-mode/reducer';
import {
  InternalClusterState,
  InternalClusterAction,
  ActionType,
} from '../../ocs-install/internal-mode/reducer';
import { KMSMaxFileUploadSize } from '../../../constants';
import {
  setEncryptionDispatch,
  generateCASecret,
  generateClientSecret,
  generateClientKeySecret,
} from '../../kms-config/utils';
import { StorageClassState, StorageClassClusterAction } from '../../../utils/kms-encryption';
import './advanced-kms-modal.scss';

export const AdvancedKMSModal = withHandlePromise((props: AdvancedKMSModalProps) => {
  const { close, cancel, errorMessage, inProgress, state, dispatch, mode } = props;
  const { kms } = state;
  const { t } = useTranslation();
  const [backendPath, setBackendPath] = React.useState(kms?.backend || '');
  const [tlsName, setTLSName] = React.useState(kms?.tls || '');
  const [caCertificate, setCACertificate] = React.useState(
    kms?.caCert?.stringData['ca.cert'] || '',
  );
  const [caCertificateFile, setCACertificateFile] = React.useState(kms?.caCertFile || '');
  const [clientCertificate, setClientCertificate] = React.useState(
    kms?.clientCert?.stringData['tls.cert'] || '',
  );
  const [clientCertificateFile, setClientCertificateFile] = React.useState(
    kms?.clientCertFile || '',
  );
  const [clientKey, setClientKey] = React.useState(kms?.clientCert?.stringData['tls.key'] || '');
  const [clientKeyFile, setClientKeyFile] = React.useState(kms?.clientKeyFile || '');
  const [providerNS, setProvideNS] = React.useState(kms?.providerNamespace || '');
  const [error, setError] = React.useState('');

  const vaultNamespaceTooltip = t(
    'ceph-storage-plugin~Vault enterprise namespaces are isolated environments that functionally exist as Vaults within a Vault. They have separate login paths and support creating and managing data isolated to their namespace.',
  );

  const KMSFileSizeErrorMsg = t(
    'ceph-storage-plugin~Maximum file size exceeded. File limit is 4MB.',
  );

  const vaultCACertTooltip = t(
    `ceph-storage-plugin~A PEM-encoded CA certificate file used to verify the Vault server's SSL certificate.`,
  );

  const vaultClientCertTooltip = t(
    `ceph-storage-plugin~A PEM-encoded client certificate. This certificate is used for TLS communication with the Vault server.`,
  );

  const vaultClientKeyTooltip = t(
    `ceph-storage-plugin~An unencrypted, PEM-encoded private key which corresponds to the matching client certificate provided with VAULT_CLIENT_CERT.`,
  );

  const vaultTLSTooltip = t(
    `ceph-storage-plugin~The name to use as the SNI host when OpenShift Container Storage connecting via TLS to the Vault server`,
  );

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const kmsAdvanced = {
      ...kms,
      backend: backendPath,
      tls: tlsName,
      providerNamespace: providerNS,
      caCertFile: caCertificateFile,
      clientCertFile: clientCertificateFile,
      clientKeyFile,
    };

    caCertificate && caCertificate !== ''
      ? (kmsAdvanced.caCert = generateCASecret(caCertificate))
      : (kmsAdvanced.caCert = null);
    clientCertificate && clientCertificate !== ''
      ? (kmsAdvanced.clientCert = generateClientSecret(clientCertificate))
      : (kmsAdvanced.clientCert = null);
    clientKey && clientCertificate !== ''
      ? (kmsAdvanced.clientKey = generateClientKeySecret(clientKey))
      : (kmsAdvanced.clientKey = null);

    setEncryptionDispatch(ActionType.SET_KMS_ENCRYPTION, mode, dispatch, kmsAdvanced);
    close();
  };
  const readFile = (file: File, fn: Function, fileFn: Function) => {
    const reader = new FileReader();
    reader.onload = () => {
      const input = reader.result;
      fn(input.toString());
    };
    if (file) {
      reader.readAsText(file, 'UTF-8');
    } else {
      fn('');
      fileFn('');
    }
  };

  const updateCaCert = (value: File, filename: string) => {
    readFile(value, setCACertificate, setCACertificateFile);
    setCACertificateFile(filename);
  };

  const updateClientCert = (value: File, filename: string) => {
    readFile(value, setClientCertificate, setClientCertificateFile);
    setClientCertificateFile(filename);
  };

  const updateClientKey = (value: File, filename: string) => {
    readFile(value, setClientKey, setClientKeyFile);
    setClientKeyFile(filename);
  };

  return (
    <Form onSubmit={submit} key="advanced-kms-modal">
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>{t('ceph-storage-plugin~Key Management Service Advanced Settings')}</ModalTitle>
        <ModalBody>
          <FormGroup
            fieldId="kms-service-backend-path"
            label={t('ceph-storage-plugin~Backend Path')}
            className="ceph-advanced-kms__form-body"
          >
            <TextInput
              value={backendPath}
              onChange={setBackendPath}
              type="text"
              id="kms-service-backend-path"
              name="kms-service-backend-path"
              placeholder={t('ceph-storage-plugin~path/')}
              data-test="kms-service-backend-path"
            />
          </FormGroup>

          <FormGroup
            fieldId="kms-service-tls"
            label={t('ceph-storage-plugin~TLS Server Name')}
            className="ceph-advanced-kms__form-body"
            labelIcon={<FieldLevelHelp>{vaultTLSTooltip}</FieldLevelHelp>}
          >
            <TextInput
              value={tlsName}
              onChange={setTLSName}
              type="text"
              id="kms-service-tls"
              name="kms-service-tls"
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-service-namespace"
            label={t('ceph-storage-plugin~Vault Enterprise Namespace')}
            className="ceph-advanced-kms__form-body"
            labelIcon={<FieldLevelHelp>{vaultNamespaceTooltip}</FieldLevelHelp>}
            helperText={t(
              'ceph-storage-plugin~The name must be accurate and must match the service namespace',
            )}
          >
            <TextInput
              value={providerNS}
              onChange={setProvideNS}
              type="text"
              id="kms-service-namespace"
              name="kms-service-namespace"
              placeholder="kms-namespace"
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-service-ca-cert"
            label={t('ceph-storage-plugin~CA Certificate')}
            className="ceph-advanced-kms__form-body"
            labelIcon={<FieldLevelHelp>{vaultCACertTooltip}</FieldLevelHelp>}
          >
            <FileUpload
              id="kms-service-ca-cert"
              value={caCertificate}
              filename={caCertificateFile}
              onChange={updateCaCert}
              hideDefaultPreview
              filenamePlaceholder={t('ceph-storage-plugin~Upload a .PEM file here...')}
              dropzoneProps={{
                accept: '.pem',
                maxSize: KMSMaxFileUploadSize,
                onDropRejected: () => setError(KMSFileSizeErrorMsg),
              }}
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-service-cert"
            label={t('ceph-storage-plugin~Client Certificate')}
            className="ceph-advanced-kms__form-body"
            labelIcon={<FieldLevelHelp>{vaultClientCertTooltip}</FieldLevelHelp>}
          >
            <FileUpload
              id="kms-service-cert"
              value={clientCertificate}
              filename={clientCertificateFile}
              onChange={updateClientCert}
              hideDefaultPreview
              filenamePlaceholder={t('ceph-storage-plugin~Upload a .PEM file here...')}
              dropzoneProps={{
                accept: '.pem',
                maxSize: KMSMaxFileUploadSize,
                onDropRejected: () => setError(KMSFileSizeErrorMsg),
              }}
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-service-key"
            label={t('ceph-storage-plugin~Client Private Key')}
            className="ceph-advanced-kms__form-body"
            labelIcon={<FieldLevelHelp>{vaultClientKeyTooltip}</FieldLevelHelp>}
          >
            <FileUpload
              id="kms-service-key"
              value={clientKey}
              filename={clientKeyFile}
              onChange={updateClientKey}
              hideDefaultPreview
              filenamePlaceholder={t('ceph-storage-plugin~Upload a .PEM file here...')}
              dropzoneProps={{
                accept: '.pem',
                maxSize: KMSMaxFileUploadSize,
                onDropRejected: () => setError(KMSFileSizeErrorMsg),
              }}
            />
          </FormGroup>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage || error}
          inProgress={inProgress}
          submitText={t('ceph-storage-plugin~Save')}
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

export type AdvancedKMSModalProps = {
  state: InternalClusterState | State | StorageClassState;
  dispatch: React.Dispatch<Action | InternalClusterAction | StorageClassClusterAction>;
  mode?: string;
} & HandlePromiseProps &
  ModalComponentProps;

export const advancedKMSModal = createModalLauncher(AdvancedKMSModal);
