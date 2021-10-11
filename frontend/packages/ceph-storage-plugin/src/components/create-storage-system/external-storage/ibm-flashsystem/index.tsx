import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  TextInput,
  InputGroup,
  Button,
  Tooltip,
  ValidatedOptions,
  Select,
  SelectOption,
} from '@patternfly/react-core';
import { EyeSlashIcon, EyeIcon } from '@patternfly/react-icons';
import { SecretKind, apiVersionForModel } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { FlashSystemState, IBMFlashSystemKind } from './type';
import { IBMFlashSystemModel } from './models';
import { CreatePayload, ExternalComponentProps, CanGoToNextStep } from '../types';

const VOLUME_MODES = ['thick', 'thin'];
const isValidIP = (address) =>
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    address,
  );

export const FlashSystemConnectionDetails: React.FC<ExternalComponentProps<FlashSystemState>> = ({
  setFormState,
  formState,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [reveal, setReveal] = React.useState(false);
  const [endpointValid, setEndpointValid] = React.useState(ValidatedOptions.default);

  const onChange = (value: string) => {
    setFormState('endpoint', value);
    value && isValidIP(value)
      ? setEndpointValid(ValidatedOptions.success)
      : setEndpointValid(ValidatedOptions.error);
  };

  const onToggle = () => setIsOpen(!isOpen);

  const onModeSelect = (event, value) => {
    event.preventDefault();
    setFormState('volmode', value);
    setIsOpen(!isOpen);
  };

  return (
    <>
      <FormGroup
        label={t('ceph-storage-plugin~IP address')}
        fieldId="endpoint-input"
        isRequired
        validated={endpointValid}
        helperText={t('ceph-storage-plugin~Rest API IP address of IBM FlashSystem.')}
        helperTextInvalid={t('ceph-storage-plugin~The endpoint is not a valid IP address')}
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
          <Tooltip
            content={
              reveal
                ? t('ceph-storage-plugin~Hide password')
                : t('ceph-storage-plugin~Reveal password')
            }
          >
            <Button variant="control" onClick={() => setReveal(!reveal)}>
              {reveal ? <EyeSlashIcon /> : <EyeIcon />}
            </Button>
          </Tooltip>
        </InputGroup>
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Pool name')} isRequired fieldId="poolname-input">
        <TextInput
          id="poolname-input"
          value={formState.poolname}
          type="text"
          onChange={(value: string) => setFormState('poolname', value)}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Volume mode')} fieldId="volume-mode-input">
        <Select
          onSelect={onModeSelect}
          id="volume-mode-input"
          selections={formState.volmode}
          onToggle={onToggle}
          isOpen={isOpen}
          isDisabled={false}
          placeholderText={VOLUME_MODES[0]}
        >
          {VOLUME_MODES.map((mode) => (
            <SelectOption key={mode} value={mode} />
          ))}
        </Select>
      </FormGroup>
    </>
  );
};

export const createFlashSystemPayload: CreatePayload<FlashSystemState> = (
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
        spaceEfficiency: form.volmode ? form.volmode : defaultVolumeMode,
        fsType: defaultFilesystem,
        volumeNamePrefix: defaultVolumePrefix,
      },
    },
  };
  const flashSystemPayload = {
    model,
    payload: IBMFlashSystemTemplate,
  };

  const storageSecretTemplate: SecretKind = {
    apiVersion: apiVersionForModel(SecretModel),
    stringData: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      management_address: form.endpoint,
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

  return [secretPayload, flashSystemPayload];
};

export const flashSystemCanGoToNextStep: CanGoToNextStep<FlashSystemState> = (state) =>
  !!state.endpoint &&
  isValidIP(state.endpoint) &&
  !!state.username &&
  !!state.password &&
  !!state.poolname;
