import * as React from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Popover,
  PopoverPosition,
  TextInput,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';
import {
  ButtonBar,
  Dropdown,
  Firehose,
  history,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  K8sResourceKind,
  k8sCreate,
  modelFor,
  referenceForGroupVersionKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  RedExclamationCircleIcon,
  useActiveNamespace,
  validateDNS1123SubdomainValue,
  ValidationErrorType,
} from '@console/shared';
import { NetworkAttachmentDefinitionModel, SriovNetworkNodePolicyModel } from '../..';
import {
  NET_ATTACH_DEF_HEADER_LABEL,
  bridgeNetworkType,
  networkTypeParams,
  networkTypes,
  ovnKubernetesNetworkType,
  ovnKubernetesSecondaryLocalnet,
} from '../../constants/constants';
import {
  NetworkAttachmentDefinitionAnnotations,
  NetworkAttachmentDefinitionConfig,
  TypeParamsData,
} from '../../types';
import NetworkTypeOptions from './NetworkTypeOptions';

const buildConfig = (
  name,
  networkType,
  typeParamsData,
  namespace,
): NetworkAttachmentDefinitionConfig => {
  const config: NetworkAttachmentDefinitionConfig = {
    name,
    type: networkType,
    cniVersion: '0.3.1',
  };

  let ipam = {};
  try {
    ipam = JSON.parse(_.get(typeParamsData, 'ipam.value', {}));
  } catch (e) {
    console.error('Could not parse ipam.value JSON', e); // eslint-disable-line no-console
  }

  if (networkType === bridgeNetworkType) {
    config.bridge = _.get(typeParamsData, 'bridge.value', '');
    config.vlan = parseInt(typeParamsData?.vlanTagNum?.value, 10) || undefined;
    config.macspoofchk = _.get(typeParamsData, 'macspoofchk.value', true);
    config.ipam = ipam;
    config.preserveDefaultVlan = false;
  } else if (networkType === 'sriov') {
    config.ipam = ipam;
  } else if (networkType === ovnKubernetesNetworkType) {
    config.topology = 'layer2';
    config.netAttachDefName = `${namespace}/${name}`;
    config.subnets = _.get(typeParamsData, 'subnets.value');
  } else if (networkType === ovnKubernetesSecondaryLocalnet) {
    config.cniVersion = '0.4.0';
    config.name = _.get(typeParamsData, 'bridgeMapping.value', '');
    config.type = ovnKubernetesNetworkType;
    config.topology = 'localnet';
    config.vlanID = parseInt(typeParamsData?.vlanID?.value, 10) || undefined;
    config.mtu = parseInt(typeParamsData?.mtu?.value, 10) || undefined;
    config.netAttachDefName = `${namespace}/${name}`;
    config.subnets = _.get(typeParamsData, 'subnets.value');
    config.excludeSubnets = _.get(typeParamsData, 'excludeSubnets.value');
  }
  return config;
};

const getResourceName = (networkType, typeParamsData): string => {
  if (_.isEmpty(typeParamsData)) return null;

  return networkType === bridgeNetworkType
    ? `bridge.network.kubevirt.io/${_.get(typeParamsData, 'bridge.value', '')}`
    : `openshift.io/${_.get(typeParamsData, 'resourceName.value', '')}`;
};

const generateNADName = (): string => {
  return `network-${uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: '-',
  })}`;
};

const createNetAttachDef = (
  e: React.FormEvent<EventTarget>,
  description,
  name,
  networkType,
  typeParamsData,
  namespace,
  setError,
  setLoading,
) => {
  e.preventDefault();

  setLoading(true);
  setError(null);

  const config = JSON.stringify(buildConfig(name, networkType, typeParamsData, namespace));
  const resourceName = getResourceName(networkType, typeParamsData);
  const annotations: NetworkAttachmentDefinitionAnnotations = {
    ...(resourceName && { 'k8s.v1.cni.cncf.io/resourceName': resourceName }),
  };

  if (!_.isEmpty(description)) {
    annotations.description = description;
  }

  const newNetAttachDef = {
    apiVersion: `${NetworkAttachmentDefinitionModel.apiGroup}/${NetworkAttachmentDefinitionModel.apiVersion}`,
    kind: NetworkAttachmentDefinitionModel.kind,
    metadata: {
      name,
      namespace,
      annotations,
    },
    spec: {
      config,
    },
  };

  k8sCreate(NetworkAttachmentDefinitionModel, newNetAttachDef)
    .then(() => {
      setLoading(false);
      history.push(resourcePathFromModel(NetworkAttachmentDefinitionModel, name, namespace));
    })
    .catch((err) => {
      setError(err);
      setLoading(false);
      console.error('Error while create a NetworkAttachmentDefinitionModel', err); // eslint-disable-line no-console
    });
};

const handleNameChange = (enteredName, namespace, fieldErrors, setName, setFieldErrors) => {
  const fieldErrorsUpdate = { ...fieldErrors };
  delete fieldErrorsUpdate.nameValidationMsg;

  const nameValidation = validateDNS1123SubdomainValue(enteredName, {
    // t('network-attachment-definition-plugin~Network attachment definition name cannot be empty')
    // t('network-attachment-definition-plugin~Network attachment definition name can contain only alphanumeric characters')
    // t('network-attachment-definition-plugin~Network attachment definition name must start/end with alphanumeric character')
    // t('network-attachment-definition-plugin~Network attachment definition name cannot contain uppercase characters')
    // t('network-attachment-definition-plugin~Network attachment definition name is too long')
    // t('network-attachment-definition-plugin~Network attachment definition name is too short')
    emptyMsg:
      'network-attachment-definition-plugin~Network attachment definition name cannot be empty',
    errorMsg:
      'network-attachment-definition-plugin~Network attachment definition name can contain only alphanumeric characters',
    startEndAlphanumbericMsg:
      'network-attachment-definition-plugin~Network attachment definition name must start/end with alphanumeric character',
    uppercaseMsg:
      'network-attachment-definition-plugin~Network attachment definition name cannot contain uppercase characters',
    longMsg: 'network-attachment-definition-plugin~Network attachment definition name is too long',
    shortMsg:
      'network-attachment-definition-plugin~Network attachment definition name is too short',
  });
  if (_.get(nameValidation, 'type', null) === ValidationErrorType.Error) {
    fieldErrorsUpdate.nameValidationMsg = nameValidation.messageKey;
  }

  setName(enteredName);
  setFieldErrors(fieldErrorsUpdate);
};

const getNetworkTypes = (hasSriovNetNodePolicyCRD, hasHyperConvergedCRD, hasOVNK8sNetwork) => {
  const types = _.clone(networkTypes);
  if (!hasSriovNetNodePolicyCRD) {
    delete types.sriov;
  }

  if (!hasHyperConvergedCRD) {
    delete types[bridgeNetworkType];
  }

  if (!hasOVNK8sNetwork) {
    delete types[ovnKubernetesNetworkType];
    delete types[ovnKubernetesSecondaryLocalnet];
  }

  return types;
};

const allTypeParamFieldsValid = (typeParamsData) => {
  return !_.some(typeParamsData, ({ validationMsg }) => validationMsg !== null);
};

const allRequiredFieldsFilled = (name, networkType, typeParamsData): boolean => {
  if (_.isEmpty(name) || networkType === null) {
    return false;
  }

  const allParamsForType = _.get(networkTypeParams, [networkType]);
  const requiredKeys = _.keys(allParamsForType).filter((key) =>
    _.get(allParamsForType, [key, 'required'], false),
  );

  return _.every(requiredKeys, (key) => {
    const value = _.get(typeParamsData, [key, 'value']);
    return !_.isEmpty(value);
  });
};

const validateForm = (fieldErrors, name, networkType, typeParamsData, setError) => {
  setError(null);
  const nameIsValid = _.get(fieldErrors, 'nameValidationMsg', '') === '';

  return (
    nameIsValid &&
    allRequiredFieldsFilled(name, networkType, typeParamsData) &&
    allTypeParamFieldsValid(typeParamsData)
  );
};

const NetworkAttachmentDefinitionFormBase = (props) => {
  // t('network-attachment-definition-plugin~Network Type')
  // t('network-attachment-definition-plugin~Edit YAML')
  // t('network-attachment-definition-plugin~Networks are not project-bound. Using the same name creates a shared NAD.')
  const { loaded, resources, hasSriovNetNodePolicyCRD, hasHyperConvergedCRD } = props;
  const [activeNamespace] = useActiveNamespace();
  const sriovNetNodePoliciesData = _.get(resources, 'sriovnetworknodepolicies.data', []);

  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(hasSriovNetNodePolicyCRD && !loaded);
  const [name, setName] = React.useState(generateNADName());
  const [description, setDescription] = React.useState('');
  const [networkType, setNetworkType] = React.useState(null);
  const [typeParamsData, setTypeParamsData] = React.useState<TypeParamsData>({});
  const [error, setError] = React.useState(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const formIsValid = React.useMemo(
    () => validateForm(fieldErrors, name, networkType, typeParamsData, setError),
    [fieldErrors, name, networkType, typeParamsData],
  );

  const [networkConfig, networkConfigLoaded] = useK8sWatchResource<K8sResourceKind>({
    groupVersionKind: {
      kind: 'Network',
      version: 'v1',
      group: 'operator.openshift.io',
    },
    isList: false,
    name: 'cluster',
    namespaced: false,
  });

  const hasOVNK8sNetwork = networkConfig?.spec?.defaultNetwork?.type === 'OVNKubernetes';
  const networkTypeDropdownItems = getNetworkTypes(
    hasSriovNetNodePolicyCRD,
    hasHyperConvergedCRD,
    hasOVNK8sNetwork,
  );

  const networkTypeTitle = t('network-attachment-definition-plugin~Network Type');

  React.useEffect(() => setLoading(hasSriovNetNodePolicyCRD && !loaded && !networkConfigLoaded), [
    hasSriovNetNodePolicyCRD,
    networkConfigLoaded,
    resources,
    loaded,
  ]);

  // t('network-attachment-definition-plugin~Create network attachment definition')

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{NET_ATTACH_DEF_HEADER_LABEL}</div>
        <div className="co-m-pane__heading-link">
          <Link
            to={`/k8s/ns/${activeNamespace}/${referenceForModel(
              NetworkAttachmentDefinitionModel,
            )}/~new`}
            id="yaml-link"
            replace
          >
            {t('network-attachment-definition-plugin~Edit YAML')}
          </Link>
        </div>
      </h1>
      <Form>
        <FormGroup
          fieldId="basic-settings-name"
          isRequired
          label={t('network-attachment-definition-plugin~Name')}
          labelIcon={
            <Popover
              aria-label={'Help'}
              bodyContent={() =>
                t(
                  'network-attachment-definition-plugin~Networks are not project-bound. Using the same name creates a shared NAD.',
                )
              }
              position={PopoverPosition.right}
            >
              <HelpIcon className="network-type-options--help-icon" />
            </Popover>
          }
        >
          <TextInput
            type="text"
            placeholder={name}
            id="network-attachment-definition-name"
            onChange={(_event, value) =>
              handleNameChange(value, activeNamespace, fieldErrors, setName, setFieldErrors)
            }
            value={name}
          />

          {fieldErrors.nameValidationMsg && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
                  {t(fieldErrors.nameValidationMsg)}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>

        <FormGroup fieldId="basic-settings-description">
          <label htmlFor="network-attachment-definition-description">
            {t('network-attachment-definition-plugin~Description')}
          </label>
          <TextInput
            type="text"
            id="network-attachment-definition-description"
            onChange={(_event, value) => setDescription(value)}
            value={description}
          />
        </FormGroup>

        <FormGroup fieldId="basic-settings-network-type">
          <label className="control-label co-required" htmlFor="network-type">
            {networkTypeTitle}
          </label>
          {_.isEmpty(networkTypeDropdownItems) && (
            <Alert
              className="co-alert"
              isInline
              variant="warning"
              title={'Missing installed operators'}
            >
              <Trans ns="network-attachment-definition-plugin" t={t}>
                <strong>OpenShift Virtualization Operator</strong> or{' '}
                <strong>SR-IOV Network Operator </strong>
                needs to be installed on the cluster, in order to pick the Network Type.
              </Trans>
            </Alert>
          )}
          <Dropdown
            id="network-type"
            title={networkTypeTitle}
            items={networkTypeDropdownItems}
            dropDownClassName="dropdown--full-width"
            selectedKey={networkType}
            onChange={setNetworkType}
            disabled={_.isEmpty(networkTypeDropdownItems)}
          />
        </FormGroup>

        <div className="co-form-subsection">
          <NetworkTypeOptions
            networkType={networkType}
            setTypeParamsData={setTypeParamsData}
            sriovNetNodePoliciesData={sriovNetNodePoliciesData}
            typeParamsData={typeParamsData}
          />
        </div>

        <ButtonBar errorMessage={error ? error.message : ''} inProgress={loading}>
          <ActionGroup className="pf-v5-c-form">
            <Button
              id="save-changes"
              isDisabled={!formIsValid}
              onClick={(e) =>
                createNetAttachDef(
                  e,
                  description,
                  name,
                  networkType,
                  typeParamsData,
                  activeNamespace,
                  setError,
                  setLoading,
                )
              }
              type="submit"
              variant="primary"
            >
              {t('network-attachment-definition-plugin~Create')}
            </Button>
            <Button id="cancel" onClick={history.goBack} type="button" variant="secondary">
              {t('network-attachment-definition-plugin~Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </div>
  );
};

const mapStateToProps = ({ k8s }) => {
  const kindsInFlight = k8s.getIn(['RESOURCES', 'inFlight']);
  const hasHyperConvergedCRD =
    !kindsInFlight &&
    !!['v1beta1', 'v1alpha1', 'v1alpha3'].find(
      (v) => !!modelFor(referenceForGroupVersionKind('hco.kubevirt.io')(v)('HyperConverged')),
    );

  return {
    // FIXME: These should be feature flags.
    // TODO: Change back when ready to add back SR-IOV support
    // hasSriovNetNodePolicyCRD:
    //   !kindsInFlight && !!k8sModels.get(referenceForModel(SriovNetworkNodePolicyModel)),
    hasSriovNetNodePolicyCRD: false,
    hasHyperConvergedCRD,
  };
};

const networkAttachmentDefinitionFormResources = [
  {
    model: SriovNetworkNodePolicyModel,
    kind: referenceForModel(SriovNetworkNodePolicyModel),
    isList: true,
    prop: 'sriovnetworknodepolicies',
    optional: true,
  },
];

export default connect(mapStateToProps)((props) => {
  const { hasSriovNetNodePolicyCRD } = props;
  const resources = hasSriovNetNodePolicyCRD ? networkAttachmentDefinitionFormResources : [];
  return (
    <Firehose resources={resources}>
      <NetworkAttachmentDefinitionFormBase {...props} />
    </Firehose>
  );
});

type FieldErrors = {
  nameValidationMsg?: string;
};
