import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Form, 
  FormGroup, 
  TextInput,
 } from '@patternfly/react-core';
import {
  SecretKind,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import {
  SecretModel
} from '@console/internal/models';
import { CreatePayload, ExternalComponentProps, CanGoToNextStep } from '../types';
import { FlashsystemState, IBMFlashsystemKind } from './type';
import { IBMFlashsystemModel } from './models';

export const FlashsystemConnectionDetails: React.FC<ExternalComponentProps<FlashsystemState>> = ({ 
  setFormState,
  formState,
}) => {
  const { t } = useTranslation();
  return (
    <Form>
      <FormGroup 
        label={t('ceph-storage-plugin~Endpoint')} 
        fieldId="endpoint-input"
        helperText={
          t('ceph-storage-plugin~Rest API IP address of IBM Storage FlashSystem.')
        }
        >
        <TextInput
          id="endpoint-input"
          value={formState.endpoint}
          type="text"
          onChange={(value: string) => setFormState('endpoint', value)}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Username')} fieldId="username-input">
        <TextInput
          id="username-input"
          value={formState.username}
          type="text"
          onChange={(value: string) => setFormState('username', value)}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Password')} fieldId="password-input">
        <TextInput
          id="password-input"
          value={formState.password}
          type="text"
          onChange={(value: string) => setFormState('password', value)}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('ceph-storage-plugin~Poolname')} fieldId="poolname-input">
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

export const FlashsystemPayload: CreatePayload<FlashsystemState> = (systemName, form, model, storageClassName) => {
  const namespace = 'openshift-storage';
  const defaultFilesystem = 'ext4';
  const defaultVolumeMode = 'thick';
  const defaultVolumePrefix = 'odf';

  const IBMFlashsystemTemplate: IBMFlashsystemKind = {
    apiVersion: apiVersionForModel(IBMFlashsystemModel),
    kind: IBMFlashsystemModel.kind,
    metadata: {
      name: systemName,
      namespace: namespace,
    },
    spec: {
      name: systemName,
      insecureSkipVerify: true,
      secret:{
        name: systemName,
        namespace: namespace,
      },
      defaultPool:{
        poolName: form.poolname,
        storageclassName: storageClassName,
        spaceEfficiency: defaultVolumeMode,
        fsType: defaultFilesystem,
        volumeNamePrefix:defaultVolumePrefix,
      }
    },
  };
  const flashsystemPayload = {
    model: model,
    payload: IBMFlashsystemTemplate,
  };

  const storageSecretTemplate: SecretKind = {
    apiVersion: apiVersionForModel(SecretModel),
    stringData:{
      management_address: form.endpoint,
      password: form.password,
      username: form.username,
    },
    kind: 'Secret',
    metadata:{
      name: systemName,
      namespace: namespace,
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
  
  return [ secretPayload, flashsystemPayload ];
};

export const FlashsystemCanGoToNextStep: CanGoToNextStep<FlashsystemState> = (state) =>
  !!state.endpoint && !!state.username && !!state.password && !!state.poolname;
