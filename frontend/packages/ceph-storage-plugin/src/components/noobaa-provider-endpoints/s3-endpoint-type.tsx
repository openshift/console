import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { Dropdown, Firehose } from '@console/internal/components/utils';
import { Button, FormGroup, TextInput, InputGroup } from '@patternfly/react-core';
import { ProjectModel, SecretModel } from '@console/internal/models';
import { ResourceDropdown, getName, getNamespace } from '@console/shared';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { BC_PROVIDERS, AWS_REGIONS } from '../../constants';
import { endpointsSupported, awsRegionItems } from '../../utils/noobaa-utils';
import {
  StoreType,
  EXCLUDED_PREFIX,
  EXCLUDED_NS,
  CEPH_STORAGE_NAMESPACE,
} from '../../constants/common';
import { ProviderDataState, StoreAction } from '../namespace-store/reducer';
import { ODF_MANAGED_FLAG } from '../../features';
import './noobaa-provider-endpoints.scss';

type S3EndpointTypeProps = {
  type: StoreType;
  state: ProviderDataState;
  dispatch: React.Dispatch<StoreAction>;
  provider: BC_PROVIDERS;
  namespace: string;
};
type SecretDropdownProps = Omit<S3EndpointTypeProps, 'type' | 'provider'>;
type OSDSecretDropdownProps = Omit<SecretDropdownProps, 'namespace'>;

const projectResource = {
  isList: true,
  kind: ProjectModel.kind,
};
const getSecretResource = (namespace: string, optional = false) => ({
  isList: true,
  namespace,
  optional,
  kind: SecretModel.kind,
  prop: namespace,
});
const getDropdownProps = (state: ProviderDataState, t: TFunction) => ({
  id: 'secret-dropdown',
  selectedKey: state.secretName,
  placeholder: t('ceph-storage-plugin~Select Secret'),
  className: 'nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width',
  buttonClassName: 'nb-endpoints-form-entry__dropdown',
  dataSelector: ['metadata', 'name'],
});
const isValidNS = (projName: string) => {
  const isValid = EXCLUDED_PREFIX.reduce((acc, cur) => {
    return acc && !projName.startsWith(cur);
  }, true);
  return isValid && !EXCLUDED_NS.includes(projName);
};
const transformLabel = (resource: K8sResourceCommon) => (
  <span className="co-resource-item">
    <span className="co-resource-item__resource-name">
      <span>{getName(resource)}</span>
      {getNamespace(resource) && (
        <div className="text-muted co-truncate co-nowrap small co-resource-item__resource-namespace">
          {getNamespace(resource)}
        </div>
      )}
    </span>
  </span>
);
const getTransformLabelName = (item: object) =>
  _.get(_.get(item, ['props', 'children', 'props', 'children'])[0], ['props', 'children']);
const autocompleteFilter = (strText: string, item: object) =>
  getTransformLabelName(item).includes(strText);

const OSDSecretDropdown: React.FC<OSDSecretDropdownProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();
  const [projData, projDataLoaded, projDataError] = useK8sWatchResource<K8sResourceCommon[]>(
    projectResource,
  );
  const secretResources = React.useMemo(() => {
    const res = [];
    if (projDataLoaded && !projDataError) {
      res.push(getSecretResource(CEPH_STORAGE_NAMESPACE, true));
      projData.forEach((project) => {
        const name = getName(project);
        if (isValidNS(name)) res.push(getSecretResource(name, true));
      });
    }
    return res;
  }, [projData, projDataLoaded, projDataError]);

  return (
    <Firehose resources={secretResources}>
      <ResourceDropdown
        {...getDropdownProps(state, t)}
        onChange={(key, obj, resource) => {
          dispatch({ type: 'setSecretName', value: key });
          dispatch({ type: 'setSecretNamespace', value: getNamespace(resource) });
        }}
        autocompleteFilter={autocompleteFilter}
        transformLabel={transformLabel}
      />
    </Firehose>
  );
};

export const SecretDropdown: React.FC<SecretDropdownProps> = ({ state, dispatch, namespace }) => {
  const { t } = useTranslation();
  const isOdfManaged = useFlag(ODF_MANAGED_FLAG);

  return !isOdfManaged ? (
    <Firehose resources={[getSecretResource(namespace)]}>
      <ResourceDropdown
        {...getDropdownProps(state, t)}
        onChange={(e) => dispatch({ type: 'setSecretName', value: e })}
      />
    </Firehose>
  ) : (
    <OSDSecretDropdown state={state} dispatch={dispatch} />
  );
};

export const S3EndPointType: React.FC<S3EndpointTypeProps> = (props) => {
  const { t } = useTranslation();
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
            <SecretDropdown state={state} dispatch={dispatch} namespace={namespace} />
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
