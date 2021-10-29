import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormGroup, TextInput, Button, ValidatedOptions } from '@patternfly/react-core';
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { PencilAltIcon } from '@patternfly/react-icons';
import { kmsConfigValidation } from './utils';
import { KMSConfigureProps } from './providers';
import { advancedHpcsModal } from '../modals/advanced-kms-modal/advanced-ibm-kms-modal';
import { HpcsConfig, ProviderNames } from '../../types';
import './kms-config.scss';

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

  const setServiceName = (name: string) => {
    kmsObj.name.value = name;
    kmsObj.name.valid = name !== '';
    dispatch({
      type: 'securityAndNetwork/setHpcs',
      payload: kmsObj,
    });
  };

  const setInstanceId = (instanceId: string) => {
    kmsObj.instanceId.value = instanceId;
    kmsObj.instanceId.valid = instanceId !== '';
    dispatch({
      type: 'securityAndNetwork/setHpcs',
      payload: kmsObj,
    });
  };

  const setApiKey = (apiKey: string) => {
    kmsObj.apiKey.value = apiKey;
    kmsObj.apiKey.valid = apiKey !== '';
    dispatch({
      type: 'securityAndNetwork/setHpcs',
      payload: kmsObj,
    });
  };

  const setRootKey = (rootKey: string) => {
    kmsObj.rootKey.value = rootKey;
    kmsObj.rootKey.valid = rootKey !== '';
    dispatch({
      type: 'securityAndNetwork/setHpcs',
      payload: kmsObj,
    });
  };

  const openAdvancedModal = () =>
    advancedHpcsModal({
      state,
      dispatch,
    });

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
          onChange={setServiceName}
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
          onChange={setInstanceId}
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
          onChange={setApiKey}
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
        label={t('ceph-storage-plugin~Service root key')}
        className={`${className}__form-body`}
        helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
        validated={isValid(kms.rootKey?.valid)}
        isRequired
      >
        <TextInput
          value={kms.rootKey?.value}
          onChange={setRootKey}
          type="text"
          id="kms-root-key"
          name="kms-root-key"
          isRequired
          validated={isValid(kms.rootKey?.valid)}
          data-test="kms-root-key-text"
        />
      </FormGroup>
      <Button
        variant="link"
        className={`${className}__form-body`}
        onClick={openAdvancedModal}
        data-test="kms-advanced-settings-link"
      >
        {t('ceph-storage-plugin~Advanced Settings')}{' '}
        {(kms.baseUrl || kms.tokenUrl) && (
          <PencilAltIcon data-test="edit-icon" size="sm" color={blueInfoColor.value} />
        )}
      </Button>
    </>
  );
};
