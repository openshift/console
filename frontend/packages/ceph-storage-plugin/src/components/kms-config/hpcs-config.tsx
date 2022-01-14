import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { kmsConfigValidation } from './utils';
import { KMSConfigureProps } from './providers';
import { HpcsConfig, HPCSParams, ProviderNames } from '../../types';
import './kms-config.scss';

const IBM_TOKEN_URL = 'https://iam.cloud.ibm.com/oidc/token';

export const HpcsConfigure: React.FC<KMSConfigureProps> = ({ state, dispatch, className }) => {
  const { t } = useTranslation();

  const kms: HpcsConfig = state.kms?.[ProviderNames.HPCS];
  const kmsObj: HpcsConfig = _.cloneDeep(kms);

  React.useEffect(() => {
    const hasHandled: boolean = kmsConfigValidation(kms, ProviderNames.HPCS);
    if (kms.hasHandled !== hasHandled)
      dispatch({
        type: 'securityAndNetwork/setHpcs',
        payload: {
          ...kms,
          hasHandled,
        },
      });
  }, [dispatch, kms]);

  const setParams = (param: string, isRequired: boolean = true) => (value: string) => {
    if (isRequired) {
      kmsObj[param].value = value;
      kmsObj[param].valid = value !== '';
    } else {
      kmsObj[param] = value;
    }
    dispatch({
      type: 'securityAndNetwork/setHpcs',
      payload: kmsObj,
    });
  };

  const isValid = (value: boolean) => (value ? ValidatedOptions.default : ValidatedOptions.error);

  return (
    <>
      <FormGroup
        fieldId="kms-service-name"
        label={t('ceph-storage-plugin~Connection name')}
        className={`${className}__form-body`}
        helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
        validated={isValid(kms.name?.valid)}
        helperText={t(
          'ceph-storage-plugin~A unique name for the key management service within the project.',
        )}
        isRequired
      >
        <TextInput
          value={kms.name?.value}
          onChange={setParams(HPCSParams.NAME)}
          type="text"
          id="kms-service-name"
          name="kms-service-name"
          isRequired
          validated={isValid(kms.name?.valid)}
          data-test="kms-service-name-text"
        />
      </FormGroup>
      <FormGroup
        fieldId="kms-instance-id"
        label={t('ceph-storage-plugin~Service instance ID')}
        className={`${className}__form-body`}
        helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
        validated={isValid(kms.instanceId?.valid)}
        isRequired
      >
        <TextInput
          value={kms.instanceId?.value}
          onChange={setParams(HPCSParams.INSTANCE_ID)}
          type="text"
          id="kms-instance-id"
          name="kms-instance-id"
          isRequired
          validated={isValid(kms.instanceId?.valid)}
          data-test="kms-instance-id-text"
        />
      </FormGroup>
      <FormGroup
        fieldId="kms-api-key"
        label={t('ceph-storage-plugin~Service API key')}
        className={`${className}__form-body`}
        helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
        validated={isValid(kms.apiKey?.valid)}
        isRequired
      >
        <TextInput
          value={kms.apiKey?.value}
          onChange={setParams(HPCSParams.API_KEY)}
          type="text"
          id="kms-api-key"
          name="kms-api-key"
          isRequired
          validated={isValid(kms.apiKey?.valid)}
          data-test="kms-api-key-text"
        />
      </FormGroup>
      <FormGroup
        fieldId="kms-root-key"
        label={t('ceph-storage-plugin~Customer root key')}
        className={`${className}__form-body`}
        helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
        validated={isValid(kms.rootKey?.valid)}
        isRequired
      >
        <TextInput
          value={kms.rootKey?.value}
          onChange={setParams(HPCSParams.ROOT_KEY)}
          type="text"
          id="kms-root-key"
          name="kms-root-key"
          isRequired
          validated={isValid(kms.rootKey?.valid)}
          data-test="kms-root-key-text"
        />
      </FormGroup>
      <FormGroup
        fieldId="kms-base-url"
        label={t('ceph-storage-plugin~IBM Base URL')}
        className={`${className}__form-body`}
        helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
        validated={isValid(kms.baseUrl?.valid)}
        isRequired
      >
        <TextInput
          value={kms.baseUrl?.value}
          onChange={setParams(HPCSParams.BASE_URL)}
          type="text"
          id="kms-base-url"
          name="kms-base-url"
          isRequired
          validated={isValid(kms.baseUrl?.valid)}
          data-test="kms-base-url"
        />
      </FormGroup>
      <FormGroup
        fieldId="kms-token-url"
        label={t('ceph-storage-plugin~IBM Token URL')}
        className={`${className}__form-body`}
      >
        <TextInput
          value={kms.tokenUrl}
          onChange={setParams(HPCSParams.TOKEN_URL, false)}
          placeholder={IBM_TOKEN_URL}
          type="text"
          id="kms-token-url"
          name="kms-token-url"
          data-test="kms-token-url"
        />
      </FormGroup>
    </>
  );
};
