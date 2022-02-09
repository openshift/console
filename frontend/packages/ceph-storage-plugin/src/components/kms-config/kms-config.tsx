import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useFlag } from '@console/shared/src/hooks/flag';
import { VaultConfigure } from './vault-config';
import { HpcsConfigure } from './hpcs-config';
import { EncryptionDispatch, KMSConfigureProps } from './providers';
import { isLengthUnity } from './utils';
import { FEATURES } from '../../features';
import { ProviderNames } from '../../types';
import './kms-config.scss';

const KMSProviders = [
  {
    name: 'Vault',
    value: ProviderNames.VAULT,
    Component: VaultConfigure,
  },
  {
    name: 'Hyper Protect Crypto Services',
    value: ProviderNames.HPCS,
    Component: HpcsConfigure,
    allowedPlatforms: ['IBMCloud'],
  },
]; // add one more key, if need to disable any component based on the value of "isWizardFlow"

const setKMSProvider = (dispatch: EncryptionDispatch) => (provider: ProviderNames) =>
  dispatch({
    type: 'securityAndNetwork/setKmsProvider',
    payload: provider,
  });

export const KMSConfigure: React.FC<KMSConfigureProps> = ({
  state,
  dispatch,
  className,
  infraType,
  isWizardFlow,
  mode, // ToDo(Sanjal): remove the use of "mode" once older OCS wizard code is removed
}) => {
  const { t } = useTranslation();

  const isHpcsKmsSupported = useFlag(FEATURES.ODF_HPCS_KMS);
  // vault as default KMS
  const kmsProvider: ProviderNames = state.kms?.['provider'] || ProviderNames.VAULT;
  const allowedKMSProviders = KMSProviders.filter(
    (provider) => !provider.allowedPlatforms || provider?.allowedPlatforms.includes(infraType),
  );
  const { Component } = allowedKMSProviders.find((provider) => provider.value === kmsProvider);

  return (
    <div className="co-m-pane__form">
      {!isWizardFlow && (
        <h3 className="ocs-install-kms__heading">
          {t('ceph-storage-plugin~Connect to a Key Management Service')}
        </h3>
      )}
      <FormGroup
        fieldId="kms-provider"
        label={t('ceph-storage-plugin~Key management service provider')}
        className={`${className}__form-body`}
      >
        <FormSelect
          value={kmsProvider}
          onChange={setKMSProvider(dispatch)}
          id="kms-provider"
          name="kms-provider-name"
          aria-label={t('ceph-storage-plugin~kms-provider-name')}
          isDisabled={!isHpcsKmsSupported || isLengthUnity(allowedKMSProviders)}
        >
          {allowedKMSProviders.map((provider) => (
            <FormSelectOption value={provider.value} label={provider.name} key={provider.value} />
          ))}
        </FormSelect>
      </FormGroup>
      <Component
        state={state}
        dispatch={dispatch}
        className={className}
        mode={mode}
        isWizardFlow={isWizardFlow}
      />
    </div>
  );
};
