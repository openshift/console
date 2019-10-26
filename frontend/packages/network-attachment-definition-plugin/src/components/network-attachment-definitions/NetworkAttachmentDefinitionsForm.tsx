import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';
import { Form, FormControl, FormGroup, HelpBlock } from 'patternfly-react';
import { ActionGroup, Button } from '@patternfly/react-core';
import { ButtonBar, Dropdown, Firehose, history } from '@console/internal/components/utils';
import { k8sCreate } from '@console/internal/module/k8s';
import { validateDNS1123SubdomainValue, ValidationErrorType } from '@console/shared';
import { NetworkAttachmentDefinitionModel, SriovNetworkNodePolicyModel } from '../..';
import { NetworkAttachmentDefinitionConfig } from '../../types';
import { networkTypeParams, networkTypes } from '../../constants';
import NetworkTypeOptions from './NetworkTypeOptions';

const buildConfig = (name, networkType, typeParamsData): NetworkAttachmentDefinitionConfig => {
  const config: NetworkAttachmentDefinitionConfig = {
    name,
    type: networkType,
    cniVersion: '0.3.1',
  };

  _.forOwn(typeParamsData, (val, key) => {
    config[key] = _.get(val, 'value', null);
  });

  return config;
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

  const config = JSON.stringify(buildConfig(name, networkType, typeParamsData));
  const newNetAttachDef = {
    apiVersion: `${NetworkAttachmentDefinitionModel.apiGroup}/${
      NetworkAttachmentDefinitionModel.apiVersion
    }`,
    kind: NetworkAttachmentDefinitionModel.kind,
    metadata: {
      name,
      namespace,
      annotations: {
        description,
      },
    },
    spec: {
      config,
    },
  };

  k8sCreate(NetworkAttachmentDefinitionModel, newNetAttachDef)
    .then(() => {
      setLoading(false);
      history.push(`/k8s/ns/${namespace || 'default'}/networkattachmentdefinitions`);
    })
    .catch((err) => {
      setError(err);
      setLoading(false);
      console.error(err); // eslint-disable-line no-console
    });
};

const handleNameChange = (enteredName, fieldErrors, setName, setFieldErrors) => {
  const fieldErrorsUpdate = { ...fieldErrors };
  delete fieldErrorsUpdate.nameValidationMsg;

  const nameValidation = validateDNS1123SubdomainValue(enteredName);
  if (_.get(nameValidation, 'type', null) === ValidationErrorType.Error) {
    fieldErrorsUpdate.nameValidationMsg = nameValidation.message;
  }

  setName(enteredName);
  setFieldErrors(fieldErrorsUpdate);
};

const getNetworkTypes = (hasSriovNetNodePolicyCRD) => {
  const types = _.clone(networkTypes);
  if (!hasSriovNetNodePolicyCRD) {
    delete types.sriov;
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
  const { loaded, match, resources, hasSriovNetNodePolicyCRD } = props;
  const namespace = _.get(match, 'params.ns', 'default');
  const sriovNetNodePoliciesData = _.get(resources, 'sriovnetworknodepolicies.data', []);

  const [loading, setLoading] = React.useState(loaded);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [networkType, setNetworkType] = React.useState(null);
  const [typeParamsData, setTypeParamsData] = React.useState({}); // TODO add typing
  const [error, setError] = React.useState(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const networkTypeDropdownItems = React.useMemo(() => getNetworkTypes(hasSriovNetNodePolicyCRD), [
    hasSriovNetNodePolicyCRD,
  ]);

  const formIsValid = React.useMemo(
    () => validateForm(fieldErrors, name, networkType, typeParamsData, setError),
    [fieldErrors, name, networkType, typeParamsData],
  );

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">Create Network Attachment Definition</div>
        <div className="co-m-pane__heading-link">
          <Link
            to={`/k8s/ns/${namespace}/networkattachmentdefinitions/~new`}
            id="yaml-link"
            replace
          >
            Edit YAML
          </Link>
        </div>
      </h1>
      <Form>
        <FormGroup
          fieldId="basic-settings-name"
          validationState={fieldErrors.nameValidationMsg ? 'error' : null}
        >
          <label className="control-label co-required" htmlFor="network-attachment-definition-name">
            Name
          </label>
          <FormControl
            type="text"
            bsClass="pf-c-form-control"
            placeholder={name}
            id="network-attachment-definition-name"
            onChange={(e) => handleNameChange(e.target.value, fieldErrors, setName, setFieldErrors)}
            value={name}
          />
          <HelpBlock>{fieldErrors.nameValidationMsg || null}</HelpBlock>
        </FormGroup>

        <FormGroup fieldId="basic-settings-description">
          <label htmlFor="network-attachment-definition-description">Description</label>
          <FormControl
            type="text"
            bsClass="pf-c-form-control"
            id="network-attachment-definition-description"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
        </FormGroup>

        <FormGroup fieldId="basic-settings-network-type">
          <label className="control-label co-required" htmlFor="network-type">
            Network Type
          </label>
          <Dropdown
            id="network-type"
            title="Network Type"
            items={networkTypeDropdownItems}
            dropDownClassName="dropdown--full-width"
            selectedKey={networkType}
            onChange={(e) => setNetworkType(e)}
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
          <ActionGroup className="pf-c-form">
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
                  namespace,
                  setError,
                  setLoading,
                )
              }
              type="submit"
              variant="primary"
            >
              Create
            </Button>
            <Button
              id="cancel"
              onClick={() =>
                history.push(`/k8s/ns/${namespace || 'default'}/networkattachmentdefinitions`)
              }
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </div>
  );
};

const mapStateToProps = ({ k8s }) => {
  const kindsInFlight = k8s.getIn(['RESOURCES', 'inFlight']);
  const k8sModels = k8s.getIn(['RESOURCES', 'models']);

  return {
    hasSriovNetNodePolicyCRD: !kindsInFlight && !!k8sModels.get(SriovNetworkNodePolicyModel.kind),
  };
};

export const ConnectedNetworkAttachmentDefinitionForm = connect(mapStateToProps)(
  NetworkAttachmentDefinitionFormBase,
);

const resources = [
  {
    model: SriovNetworkNodePolicyModel,
    kind: SriovNetworkNodePolicyModel.kind,
    namespace: 'sriov-network-operator',
    isList: true,
    prop: 'sriovnetworknodepolicies',
  },
];

export default (props) => {
  return (
    <Firehose resources={resources}>
      <ConnectedNetworkAttachmentDefinitionForm {...props} />
    </Firehose>
  );
};

type FieldErrors = {
  nameValidationMsg?: string;
};
