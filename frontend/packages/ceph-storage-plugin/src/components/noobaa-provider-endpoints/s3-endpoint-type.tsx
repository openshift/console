import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { Button, FormGroup, TextInput, InputGroup } from '@patternfly/react-core';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  DefaultSecretDropdown,
  OSDSecretDropdown,
  SecretDropdownProps,
} from './noobaa-secret-dropdown';
import { ProviderDataState, StoreAction } from '../namespace-store/reducer';
import { ODF_MANAGED_FLAG } from '../../features';
import { BC_PROVIDERS, AWS_REGIONS } from '../../constants';
import { endpointsSupported, awsRegionItems } from '../../utils/noobaa-utils';
import { StoreType } from '../../constants/common';
import './noobaa-provider-endpoints.scss';

export const S3EndPointType: React.FC<S3EndpointTypeProps> = (props) => {
  const { t } = useTranslation();

  const isOdfManaged = useFlag(ODF_MANAGED_FLAG);
  const [showSecret, setShowSecret] = React.useState(true);
  const { provider, namespace, state, dispatch, type } = props;

  const targetLabel =
    provider === BC_PROVIDERS.AZURE
      ? t('ceph-storage-plugin~Target blob container')
      : t('ceph-storage-plugin~Target bucket');
  const credentialField1Label =
    provider === BC_PROVIDERS.AZURE
      ? t('ceph-storage-plugin~Account name')
      : t('ceph-storage-plugin~Access key');
  const credentialField2Label =
    provider === BC_PROVIDERS.AZURE
      ? t('ceph-storage-plugin~Account key')
      : t('ceph-storage-plugin~Secret key');
  const Component: React.FC<SecretDropdownProps> = isOdfManaged
    ? OSDSecretDropdown
    : DefaultSecretDropdown;

  const switchToSecret = () => {
    setShowSecret(true);
    dispatch({ type: 'setAccessKey', value: '' });
    dispatch({ type: 'setSecretKey', value: '' });
  };

  const switchToCredentials = () => {
    setShowSecret(false);
    dispatch({ type: 'setSecretName', value: '' });
    dispatch({ type: 'setSecretNamespace', value: '' });
  };

  return (
    <>
      {provider === BC_PROVIDERS.AWS && (
        <FormGroup
          label={t('ceph-storage-plugin~Region')}
          fieldId="region"
          className="nb-endpoints-form-entry"
          isRequired
        >
          <Dropdown
            className="nb-endpoints-form-entry__dropdown"
            id="region"
            menuClassName="nb-endpoints-form-entry__dropdown--short"
            buttonClassName="nb-endpoints-form-entry__dropdown"
            dataTest={`${type.toLowerCase()}-aws-region-dropdown`}
            onChange={(e) => {
              dispatch({ type: 'setRegion', value: e });
            }}
            items={awsRegionItems}
            selectedKey={AWS_REGIONS[0]}
            aria-label={t('ceph-storage-plugin~Region Dropdown')}
          />
        </FormGroup>
      )}

      {endpointsSupported.includes(provider) && (
        <FormGroup
          label={t('ceph-storage-plugin~Endpoint')}
          fieldId="endpoint"
          className="nb-endpoints-form-entry"
          isRequired
        >
          <TextInput
            data-test={`${type.toLowerCase()}-s3-endpoint`}
            onChange={(e) => {
              dispatch({ type: 'setEndpoint', value: e });
            }}
            id="endpoint"
            value={state.endpoint}
            aria-label={t('ceph-storage-plugin~Endpoint Address')}
          />
        </FormGroup>
      )}

      {showSecret ? (
        <FormGroup
          label={t('ceph-storage-plugin~Secret')}
          fieldId="secret-dropdown"
          className="nb-endpoints-form-entry nb-endpoints-form-entry--full-width"
          isRequired
        >
          <InputGroup>
            <Component state={state} dispatch={dispatch} namespace={namespace} />
            <Button variant="plain" data-test="switch-to-creds" onClick={switchToCredentials}>
              {t('ceph-storage-plugin~Switch to Credentials')}
            </Button>
          </InputGroup>
        </FormGroup>
      ) : (
        <>
          <FormGroup label={credentialField1Label} fieldId="access-key">
            <InputGroup>
              <TextInput
                id="access-key"
                data-test={`${type.toLowerCase()}-access-key`}
                value={state.accessKey}
                onChange={(e) => {
                  dispatch({ type: 'setAccessKey', value: e });
                }}
                aria-label={t('ceph-storage-plugin~Access Key Field')}
              />
              <Button variant="plain" onClick={switchToSecret}>
                {t('ceph-storage-plugin~Switch to Secret')}
              </Button>
            </InputGroup>
          </FormGroup>
          <FormGroup
            className="nb-endpoints-form-entry"
            label={credentialField2Label}
            fieldId="secret-key"
          >
            <TextInput
              value={state.secretKey}
              id="secret-key"
              data-test={`${type.toLowerCase()}-secret-key`}
              onChange={(e) => {
                dispatch({ type: 'setSecretKey', value: e });
              }}
              aria-label={t('ceph-storage-plugin~Secret Key Field')}
              type="password"
            />
          </FormGroup>
        </>
      )}
      <FormGroup
        label={targetLabel}
        fieldId="target-bucket"
        className="nb-endpoints-form-entry"
        isRequired
      >
        <TextInput
          id="target-bucket"
          value={state.target}
          data-test={`${type.toLowerCase()}-target-bucket`}
          onChange={(e) => dispatch({ type: 'setTarget', value: e })}
          aria-label={targetLabel}
        />
      </FormGroup>
    </>
  );
};

type S3EndpointTypeProps = {
  type: StoreType;
  state: ProviderDataState;
  dispatch: React.Dispatch<StoreAction>;
  provider: BC_PROVIDERS;
  namespace: string;
};
