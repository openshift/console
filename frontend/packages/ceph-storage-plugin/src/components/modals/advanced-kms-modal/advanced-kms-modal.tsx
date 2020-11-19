import * as React from 'react';

import { FormGroup, TextInput, FileUpload, Tooltip, Form } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';

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
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s/types';

import { State, Action } from '../../ocs-install/attached-devices/create-sc/state';
import {
  InternalClusterState,
  InternalClusterAction,
  ActionType,
} from '../../ocs-install/internal-mode/reducer';
import {
  vaultNamespaceTooltip,
  KMSMaxFileUploadSize,
  KMSFileSizeErrorMsg,
  CEPH_STORAGE_NAMESPACE,
} from '../../../constants';
import { setEncryptionDispatch } from '../../kms-config/utils';
import './advanced-kms-modal.scss';

export const AdvancedKMSModal = withHandlePromise((props: AdvancedKMSModalProps) => {
  const { close, cancel, errorMessage, inProgress, state, dispatch, mode } = props;
  const { kms } = state;
  const [backendPath, setBackendPath] = React.useState(kms.backend || '');
  const [tlsName, setTLSName] = React.useState(kms.tls || '');
  const [caCertificate, setCACertificate] = React.useState(kms.caCert?.stringData['ca.cert'] || '');
  const [caCertificateFile, setCACertificateFile] = React.useState(kms.caCertFile || '');
  const [clientCertificate, setClientCertificate] = React.useState(
    kms.clientCert?.stringData['tls.cert'] || '',
  );
  const [clientCertificateFile, setClientCertificateFile] = React.useState(
    kms.clientCertFile || '',
  );
  const [clientKey, setClientKey] = React.useState(kms.clientCert?.stringData['tls.key'] || '');
  const [clientKeyFile, setClientKeyFile] = React.useState(kms.clientKeyFile || '');
  const [providerNS, setProvideNS] = React.useState(kms.providerNamespace || '');
  const [error, setError] = React.useState('');

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const caSecret: SecretKind = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'ocs-kms-ca',
        namespace: CEPH_STORAGE_NAMESPACE,
      },
      stringData: {
        'ca.cert': caCertificate,
      },
    };

    const clientCertSecret: SecretKind = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'ocs-kms-client-cert',
        namespace: CEPH_STORAGE_NAMESPACE,
      },
      stringData: {
        'tls.cert': clientCertificate,
      },
    };

    const clientKeySecret: SecretKind = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      metadata: {
        name: 'ocs-kms-client-key',
        namespace: CEPH_STORAGE_NAMESPACE,
      },
      stringData: {
        'tls.key': clientKey,
      },
    };

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
      ? (kmsAdvanced.caCert = caSecret)
      : (kmsAdvanced.caCert = null);
    clientCertificate && clientCertificate !== ''
      ? (kmsAdvanced.clientCert = clientCertSecret)
      : (kmsAdvanced.clientCert = null);
    clientKey && clientCertificate !== ''
      ? (kmsAdvanced.clientKey = clientKeySecret)
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
        <ModalTitle>Key Management Service Advanced Settings</ModalTitle>
        <ModalBody>
          <FormGroup
            fieldId="kms-service-backend-path"
            label="Backend Path"
            className="ceph-advanced-kms__form-body"
          >
            <TextInput
              value={backendPath}
              onChange={setBackendPath}
              type="text"
              id="kms-service-backend-path"
              name="kms-service-backend-path"
              placeholder="path/"
            />
          </FormGroup>

          <FormGroup
            fieldId="kms-service-tls"
            label="TLS Server Name"
            className="ceph-advanced-kms__form-body"
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
            label="Vault Enterprise Namespace"
            className="ceph-advanced-kms__form-body"
            labelIcon={
              <Tooltip position="top" content={vaultNamespaceTooltip}>
                <QuestionCircleIcon />
              </Tooltip>
            }
            helperText="The name must be accurate and must match the service namespace"
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
            label="CA Certificate"
            className="ceph-advanced-kms__form-body"
          >
            <FileUpload
              id="kms-service-ca-cert"
              value={caCertificate}
              filename={caCertificateFile}
              onChange={updateCaCert}
              hideDefaultPreview
              filenamePlaceholder="Upload a .PEM file here..."
              dropzoneProps={{
                accept: '.pem',
                maxSize: KMSMaxFileUploadSize,
                onDropRejected: () => setError(KMSFileSizeErrorMsg),
              }}
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-service-cert"
            label="Client Certificate"
            className="ceph-advanced-kms__form-body"
          >
            <FileUpload
              id="kms-service-cert"
              value={clientCertificate}
              filename={clientCertificateFile}
              onChange={updateClientCert}
              hideDefaultPreview
              filenamePlaceholder="Upload a .PEM file here..."
              dropzoneProps={{
                accept: '.pem',
                maxSize: KMSMaxFileUploadSize,
                onDropRejected: () => setError(KMSFileSizeErrorMsg),
              }}
            />
          </FormGroup>
          <FormGroup
            fieldId="kms-service-key"
            label="Client Private Key"
            className="ceph-advanced-kms__form-body"
          >
            <FileUpload
              id="kms-service-key"
              value={clientKey}
              filename={clientKeyFile}
              onChange={updateClientKey}
              hideDefaultPreview
              filenamePlaceholder="Upload a .PEM file here..."
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
          submitText="Save"
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

export type AdvancedKMSModalProps = {
  state: State | InternalClusterState;
  dispatch: React.Dispatch<Action | InternalClusterAction>;
  mode?: string;
} & HandlePromiseProps &
  ModalComponentProps;

export const advancedKMSModal = createModalLauncher(AdvancedKMSModal);
