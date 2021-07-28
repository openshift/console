import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';

import * as classNames from 'classnames';
import {
  InputGroup,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
  ValidatedOptions,
  Tooltip,
} from '@patternfly/react-core';
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { PencilAltIcon, EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';

import { setEncryptionDispatch, parseURL, kmsConfigValidation, EncryptionDispatch } from './utils';
import { advancedKMSModal } from '../modals/advanced-kms-modal/advanced-kms-modal';
import { InternalClusterState, ActionType } from '../ocs-install/internal-mode/reducer';
import { KMSProviders } from '../../constants';
import { KMSConfig } from '../../types';
import { State } from '../ocs-install/attached-devices-mode/reducer';
import { StorageClassState } from '../../utils/kms-encryption';
import { WizardState } from '../create-storage-system/reducer';

import './kms-config.scss';

export const KMSConfigure: React.FC<KMSConfigureProps> = ({ state, dispatch, mode, className }) => {
  const { t } = useTranslation();
  const { kms } = state;
  const kmsObj: KMSConfig = _.cloneDeep(kms);

  // Vault as default KMS
  const [kmsProvider, setKMSProvider] = React.useState<string>(KMSProviders[0].name);
  const [revealToken, setRevealToken] = React.useState(false);

  React.useEffect(() => {
    const hasHandled: boolean = kmsConfigValidation(kms);
    if (kms.hasHandled !== hasHandled) {
      mode
        ? setEncryptionDispatch(ActionType.SET_KMS_ENCRYPTION, mode, dispatch, {
            ...kms,
            hasHandled,
          })
        : dispatch({
            type: 'securityAndNetwork/setKms',
            payload: {
              ...kms,
              hasHandled,
            },
          });
    }
  }, [dispatch, mode, kms]);

  const setServiceName = (name: string) => {
    kmsObj.name.value = name;
    kmsObj.name.valid = name !== '';
    mode
      ? setEncryptionDispatch(ActionType.SET_KMS_ENCRYPTION, mode, dispatch, kmsObj)
      : dispatch({
          type: 'securityAndNetwork/setKms',
          payload: kmsObj,
        });
  };

  const setAddress = (address: string) => {
    kmsObj.address.value = address;
    kmsObj.address.valid = address !== '' && parseURL(address.trim()) != null;
    mode
      ? setEncryptionDispatch(ActionType.SET_KMS_ENCRYPTION, mode, dispatch, kmsObj)
      : dispatch({
          type: 'securityAndNetwork/setKms',
          payload: kmsObj,
        });
  };

  const setAddressPort = (port: string) => {
    kmsObj.port.value = port;
    kmsObj.port.valid =
      port !== '' && !_.isNaN(Number(port)) && Number(port) > 0 && Number(port) < 65536;
    mode
      ? setEncryptionDispatch(ActionType.SET_KMS_ENCRYPTION, mode, dispatch, kmsObj)
      : dispatch({
          type: 'securityAndNetwork/setKms',
          payload: kmsObj,
        });
  };

  const setToken = (token: string) => {
    kmsObj.token.value = token;
    kmsObj.token.valid = token !== '';
    mode
      ? setEncryptionDispatch(ActionType.SET_KMS_ENCRYPTION, mode, dispatch, kmsObj)
      : dispatch({
          type: 'securityAndNetwork/setKms',
          payload: kmsObj,
        });
  };

  const validateAddressMessage = () =>
    kms.address.value === ''
      ? t('ceph-storage-plugin~This is a required field')
      : t('ceph-storage-plugin~Please enter a URL');

  const validatePortMessage = () =>
    kms.port.value === ''
      ? t('ceph-storage-plugin~This is a required field')
      : t('ceph-storage-plugin~Please enter a valid port');

  const openAdvancedModal = () =>
    advancedKMSModal({
      state,
      dispatch,
      mode,
    });

  const isValid = (value: boolean) => (value ? ValidatedOptions.default : ValidatedOptions.error);

  return (
    <div className="co-m-pane__form">
      {!mode && <h3 className="ocs-install-kms__heading">Connect to a Key Management Service</h3>}
      <FormGroup
        fieldId="kms-provider"
        label={t('ceph-storage-plugin~Key Management Service Provider')}
        className={`${className}__form-body`}
      >
        <FormSelect
          value={kmsProvider}
          onChange={setKMSProvider}
          id="kms-provider"
          name="kms-provider-name"
          aria-label={t('ceph-storage-plugin~kms-provider-name')}
          isDisabled
        >
          {KMSProviders.map((provider) => (
            <FormSelectOption value={provider.value} label={provider.name} />
          ))}
        </FormSelect>
      </FormGroup>
      <FormGroup
        fieldId="kms-service-name"
        label={t('ceph-storage-plugin~Service Name')}
        className={`${className}__form-body`}
        helperTextInvalid="This is a required field"
        validated={isValid(kms.name.valid)}
        isRequired
      >
        <TextInput
          value={kms.name.value}
          onChange={setServiceName}
          type="text"
          id="kms-service-name"
          name="kms-service-name"
          isRequired
          validated={isValid(kms.name.valid)}
          data-test="kms-service-name-text"
        />
      </FormGroup>
      <div className="ocs-install-kms__form-url">
        <FormGroup
          fieldId="kms-address"
          label={t('ceph-storage-plugin~Address')}
          className={classNames('ocs-install-kms__form-address', `${className}__form-body`)}
          helperTextInvalid={validateAddressMessage()}
          validated={isValid(kms.address.valid)}
          isRequired
        >
          <TextInput
            value={kms.address.value}
            onChange={setAddress}
            className="ocs-install-kms__form-address--padding"
            type="url"
            id="kms-address"
            name="kms-address"
            isRequired
            validated={isValid(kms.address.valid)}
            data-test="kms-address-text"
          />
        </FormGroup>
        <FormGroup
          fieldId="kms-address-port"
          label={t('ceph-storage-plugin~Port')}
          className={classNames(
            'ocs-install-kms__form-port',
            `${className}__form-body--small-padding`,
          )}
          helperTextInvalid={validatePortMessage()}
          validated={isValid(kms.port.valid)}
          isRequired
        >
          <TextInput
            value={kms.port.value}
            onChange={setAddressPort}
            type="text"
            id="kms-address-port"
            name="kms-address-port"
            isRequired
            validated={isValid(kms.port.valid)}
            data-test="kms-address-port-text"
          />
        </FormGroup>
      </div>
      {mode && (
        <FormGroup
          fieldId="kms-token"
          label={t('ceph-storage-plugin~Token')}
          className={`${className}__form-body`}
          helperTextInvalid={t('ceph-storage-plugin~This is a required field')}
          validated={isValid(kms.token.valid)}
          isRequired
        >
          <InputGroup className="ocs-install-kms__form-token">
            <TextInput
              value={kms.token.value}
              onChange={setToken}
              type={revealToken ? 'text' : 'password'}
              id="kms-token"
              name="kms-token"
              isRequired
              validated={isValid(kms.token.valid)}
            />
            <Tooltip content={revealToken ? 'Hide token' : 'Reveal token'}>
              <Button variant="control" onClick={() => setRevealToken(!revealToken)}>
                {revealToken ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </Tooltip>
          </InputGroup>
        </FormGroup>
      )}
      <Button
        variant="link"
        className={`${className}__form-body`}
        onClick={openAdvancedModal}
        data-test="kms-advanced-settings-link"
      >
        {t('ceph-storage-plugin~Advanced Settings')}{' '}
        {(kms.backend ||
          kms.caCert ||
          kms.tls ||
          kms.clientCert ||
          kms.clientKey ||
          kms.providerNamespace) && (
          <PencilAltIcon data-test="edit-icon" size="sm" color={blueInfoColor.value} />
        )}
      </Button>
    </div>
  );
};

type KMSConfigureProps = {
  state: InternalClusterState | State | StorageClassState | WizardState['securityAndNetwork'];
  dispatch: EncryptionDispatch;
  mode?: string;
  className: string;
};
