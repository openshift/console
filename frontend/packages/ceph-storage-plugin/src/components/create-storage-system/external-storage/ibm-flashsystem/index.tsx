import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Form, 
  FormGroup, 
  TextInput,
  //Checkbox,
  //Button,
 } from '@patternfly/react-core';
import {
  SecretKind,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import {
  SecretModel
  //StorageClassModel,
} from '@console/internal/models';
import { CreatePayload, ExternalComponentProps, CanGoToNextStep } from '../types';
import { FlashsystemState, IBMFlashsystemKind } from './type';
import { IBMFlashsystemModel } from './models';

export const flashsystemConnectionDetails: React.FC<ExternalComponentProps<FlashsystemState>> = ({ 
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
  
/*
  const [showPassword, setShowPassword] = React.useState(false);

  const create = (event: React.FormEvent<EventTarget>) => {
    const storageSecretTemplate: SecretKind = {
      apiVersion: apiVersionForModel(SecretModel),
      stringData:{
        management_address: endpoint,
        password: password,
        username: username,
      },
      kind: 'Secret',
      metadata:{
        name: storageName,
        namespace: namespace,
      },
      type: 'Opaque',
    };
    const IBMFlashsystemTemplate: IBMFlashsystemKind = {
      apiVersion: apiVersionForModel(IBMFlashsystemModel),
      kind: IBMFlashsystemModel.kind,
      metadata: {
        name: storageName,
        namespace: namespace,
      },
      spec: {
        name: storageName,
        endpoint: endpoint,
        insecureSkipVerify: true,
        secret:{
          name: storageName,
          namespace: namespace,
        },
      },
    };
    const IBMFlashsystemTemplateWithDefaultPool: IBMFlashsystemKind = {
      apiVersion: apiVersionForModel(IBMFlashsystemModel),
      kind: IBMFlashsystemModel.kind,
      metadata: {
        name: storageName,
        namespace: namespace,
      },
      spec: {
        name: storageName,
        endpoint: endpoint,
        insecureSkipVerify: true,
        secret:{
          name: storageName,
          namespace: namespace,
        },
        defaultPool:{
          poolname: poolName,
        }
      },
    };
  };

  var createDefaultStorageClassPage;
  if(createDefaultStorageClass) {
    createDefaultStorageClassPage = (<div className="subline-with-2-words">
            <label className="control-label co-required" htmlFor="snapshot-name">
              Pool Name
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={handlePoolName}
              name="poolname"
              id="poolname"
              value={poolName}
              required
            />
          </div>)
  } else {
    createDefaultStorageClassPage = (<div className="form-group co-pre-wrap">
    </div>)
  }

  return (
    <div className="co-volume-snapshot__body">
      <div className="co-m-pane__body co-m-pane__form">
        <form className="co-m-pane__body-group" onSubmit={create}>
          
          <div className="form-group co-volume-snapshot__form">
            <label className="control-label co-required" htmlFor="snapshot-name">
              Name
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={handlestorageName}
              name="storageName"
              id="snapshot-name"
              value={storageName}
              required
            />
          
            <label className="control-label co-required" htmlFor="endpoint">
              Endpoint
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={handleEndpoint}
              name="endpoint"
              id="endpoint"
              value={endpoint}
              required
            />
            <p className="help-block" id="label-selector-help">
            Rest API IP address of IBM Storage FlashSystem 
            </p>
          
            <label className="control-label co-required" htmlFor="username">
              Username
            </label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={handleUserName}
              name="username"
              id="username"
              value={username}
              required
            />
          
            <label className="control-label co-required" htmlFor="password">
              Password
            </label>
            
            {showPassword ? (
                <>
                  <input
                    className="pf-c-form-control"
                    type="text"
                    onChange={handlePassword}
                    name="password"
                    id="password"
                    value={password}
                    required
                  />
                  <Button isSmall isInline variant="link" onClick={() => setShowPassword(false)}>
                    {t('kubevirt-plugin~Hide password')}
                  </Button>
                </>
              ) : (
                <>
                <input
                    className="pf-c-form-control"
                    type="password"
                    onChange={handlePassword}
                    name="password"
                    id="password"
                    value={password}
                    required
                  />
                <Button isSmall isInline variant="link" onClick={() => setShowPassword(true)}>
                  {t('kubevirt-plugin~Show password')}
                </Button>
                </>
              )}
              <Checkbox
              label="Create Default StorageClass"
              onChange={handleDefaultStorageClass}
              isChecked={createDefaultStorageClass}
              id="createDefaultStorageClass"
              />
              {createDefaultStorageClassPage}
          </div>
        </form>
      </div>
    </div>
  );
  */
};

export const flashsystemPayload: CreatePayload<FlashsystemState> = (systemName, form, model, storageClassName) => {
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
  
  const allPayload = [ secretPayload, flashsystemPayload ];
  
  return allPayload;
};


export const flashsystemCanGoToNextStep: CanGoToNextStep<FlashsystemState> = (state) =>
  !!state.endpoint && !!state.username && !!state.password && !!state.poolname;