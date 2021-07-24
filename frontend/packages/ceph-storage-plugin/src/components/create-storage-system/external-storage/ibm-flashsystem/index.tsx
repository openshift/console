import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormGroup, TextInput, InputGroup, Button, Tooltip, ValidatedOptions } from '@patternfly/react-core';
import { EyeSlashIcon, EyeIcon } from '@patternfly/react-icons';
import { SecretKind, apiVersionForModel } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { isValidUrl } from '@console/shared';
import { FlashSystemState, IBMFlashSystemKind } from './type';
import { IBMFlashSystemModel } from './models';
import { CreatePayload, ExternalComponentProps, CanGoToNextStep } from '../types';

export const FlashSystemConnectionDetails: React.FC<ExternalComponentProps<FlashSystemState>> = ({
  setFormState,
  formState,
}) => {
  const { t } = useTranslation();
  const [reveal, setReveal] = React.useState(false);
  const [endpointValid, setEndpointValid] = React.useState(ValidatedOptions.default);

  const onChange = (value: string) => {
    setFormState('endpoint', value);
    value && isValidUrl(value)
      ? setEndpointValid(ValidatedOptions.success)
      : setEndpointValid(ValidatedOptions.error);
  };

  return (
    <Form>
      <FormGroup
        label={t('ceph-storage-plugin~Endpoint')}
        fieldId="endpoint-input"
        isRequired
        validated={endpointValid}
        helperText={t('ceph-storage-plugin~Rest API IP address of IBM FlashSystem.')}
        helperTextInvalid={t('ceph-storage-plugin~The endpoint is not a valid URL')}
      >
        <TextInput
          id="endpoint-input"
          value={formState.endpoint}
          type="text"
          onChange={onChange}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Username')} isRequired fieldId="username-input">
        <TextInput
          id="username-input"
          value={formState.username}
          type="text"
          onChange={(value: string) => setFormState('username', value)}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Password')} isRequired fieldId="password-input">
        <InputGroup>
          <TextInput
            id="password-input"
            value={formState.password}
            type={reveal ? 'text' : 'password'}
            onChange={(value: string) => setFormState('password', value)}
            isRequired
          />
          <Tooltip content={reveal ? 'Hide password' : 'Reveal password'}>
              <Button variant="control" onClick={() => setReveal(!reveal)}>
                {reveal ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </Tooltip>
        </InputGroup>
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Poolname')} isRequired fieldId="poolname-input">
        <TextInput
          id="poolname-input"
          value={formState.poolname}
          type="text"
          onChange={(value: string) => setFormState('poolname', value)}
          isRequired
        />
      </FormGroup>
    </Form>
  );
};

export const FlashSystemPayload: CreatePayload<FlashSystemState> = (
  systemName,
  form,
  model,
  storageClassName,
) => {
  const namespace = 'openshift-storage';
  const defaultFilesystem = 'ext4';
  const defaultVolumeMode = 'thick';
  const defaultVolumePrefix = 'odf';

  const IBMFlashSystemTemplate: IBMFlashSystemKind = {
    apiVersion: apiVersionForModel(IBMFlashSystemModel),
    kind: IBMFlashSystemModel.kind,
    metadata: {
      name: systemName,
      namespace,
    },
    spec: {
      name: systemName,
      insecureSkipVerify: true,
      secret: {
        name: systemName,
        namespace,
      },
      defaultPool: {
        poolName: form.poolname,
        storageclassName: storageClassName,
        spaceEfficiency: defaultVolumeMode,
        fsType: defaultFilesystem,
        volumeNamePrefix: defaultVolumePrefix,
      },
    },
  };
  const FlashSystemPayload = {
    model,
    payload: IBMFlashSystemTemplate,
  };

  const storageSecretTemplate: SecretKind = {
    apiVersion: apiVersionForModel(SecretModel),
    stringData: {
      managementAddress: form.endpoint,
      password: form.password,
      username: form.username,
    },
    kind: 'Secret',
    metadata: {
      name: systemName,
      namespace,
    },
    type: 'Opaque',
  };
  const { apiVersion, apiGroup, kind, plural } = SecretModel;
  const secretPayload = {
    model: {
      apiGroup,
      apiVersion,
      kind,
      plural,
    },
    payload: storageSecretTemplate,
  };

  return [secretPayload, FlashSystemPayload];
};

export const FlashSystemCanGoToNextStep: CanGoToNextStep<FlashSystemState> = (state) =>
  !!state.endpoint && !!state.username && !!state.password && !!state.poolname;
