import * as React from 'react';
import { connect } from 'react-redux';
import { match } from 'react-router';
import { Helmet } from 'react-helmet';
import { safeDump } from 'js-yaml';
import * as _ from 'lodash-es';
import { PropertyPath } from 'lodash';
import * as classNames from 'classnames';
import { Alert, ActionGroup, Button } from '@patternfly/react-core';
import { JSONSchema6TypeName } from 'json-schema';

import {
  apiVersionForModel,
  GroupVersionKind,
  ImagePullPolicy,
  k8sCreate,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceFor,
  referenceForModel,
  Status,
  nameForModel,
  CustomResourceDefinitionKind,
} from '../../module/k8s';
import { ClusterServiceVersionKind, referenceForProvidedAPI, providedAPIsFor, CRDDescription, ClusterServiceVersionLogo, APIServiceDefinition } from './index';
import { ClusterServiceVersionModel, CustomResourceDefinitionModel } from '../../models';
import { Firehose } from '../utils/firehose';
import { NumberSpinner, StatusBox, BreadCrumbs, history, SelectorInput, ListDropdown, AsyncComponent, resourcePathFromModel, FirehoseResult, useScrollToTopOnMount } from '../utils';
import { SpecCapability, StatusCapability, Descriptor } from './descriptors/types';
import { ResourceRequirements } from './descriptors/spec/resource-requirements';
import { RootState } from '../../redux';
import { CreateYAML } from '../create-yaml';
import { RadioGroup } from '../radio';
import { ConfigureUpdateStrategy } from '../modals/configure-update-strategy-modal';
import { NodeAffinity, PodAffinity, defaultNodeAffinity, defaultPodAffinity } from './descriptors/spec/affinity';

const annotationKey = 'alm-examples';

enum Validations {
  maximum = 'maximum',
  minimum = 'minimum',
  maxLength = 'maxLength',
  minLength = 'minLength',
  pattern = 'pattern',
}

/**
 * Combines OLM descriptor with JSONSchema.
 */
type OperandField = {
  path: string;
  displayName: string;
  description?: string;
  type: JSONSchema6TypeName;
  required: boolean;
  validation: {
    [Validations.maximum]?: number;
    [Validations.minimum]?: number;
    [Validations.maxLength]?: number;
    [Validations.minLength]?: number;
    [Validations.pattern]?: string;
  };
  capabilities: (SpecCapability | StatusCapability)[];
};

type FieldErrors = {
  [path: string]: string;
};

const fieldsFor = (providedAPI: CRDDescription) => _.get(providedAPI, 'specDescriptors', [] as Descriptor[]).map(desc => ({
  path: desc.path,
  displayName: desc.displayName,
  description: desc.description,
  type: null,
  required: false,
  validation: null,
  capabilities: desc['x-descriptors'],
})) as OperandField[];

const fieldsForOpenAPI = (crd: CustomResourceDefinitionKind): OperandField[] => {
  const openAPIV3Schema = _.get(crd, 'spec.validation.openAPIV3Schema', {});

  if (_.isEmpty(openAPIV3Schema)) {
    return [];
  }

  const fields: OperandField[] = _.flatten(_.map(_.get(openAPIV3Schema, 'properties.spec.properties', {}), (val, key: string) => {
    const capabilityFor = (type: string) => {
      switch (type) {
        case 'integer': return SpecCapability.number;
        case 'boolean': return SpecCapability.booleanSwitch;
        case 'string':
        default:
          return SpecCapability.text;
      }
    };

    switch (val.type) {
      case 'object':
        if (_.values(val.properties).some(nestedVal => ['object', 'array'].includes(nestedVal.type))) {
          return null;
        }
        return _.map(val.properties, (nestedVal, nestedKey: string) => ({
          path: [key, nestedKey].join('.'),
          displayName: _.startCase(nestedKey),
          type: nestedVal.type,
          required: _.get(val, 'required', []).includes(nestedKey),
          validation: null,
          capabilities: [SpecCapability.fieldGroup.concat(key), capabilityFor(nestedVal.type)],
        } as OperandField));
      case 'array':
        if (val.items.type !== 'object' || _.values(val.items.properties).some(itemVal => ['object', 'array'].includes(itemVal.type))) {
          return null;
        }
        return _.map(val.items.properties, (itemVal, itemKey: string) => ({
          path: `${key}[0].${itemKey}`,
          displayName: _.startCase(itemKey),
          type: itemVal.type,
          required: _.get(val.items, 'required', []).includes(itemKey),
          validation: null,
          capabilities: [SpecCapability.arrayFieldGroup.concat(key), capabilityFor(itemVal.type)],
        } as OperandField));
      default:
        return {
          path: key,
          displayName: _.startCase(key),
          type: val.type,
          required: _.get(openAPIV3Schema.properties.spec, 'required', []).includes(key),
          validation: _.pick(val, [...Object.keys(Validations)]),
          capabilities: [capabilityFor(val.type)],
        } as OperandField;
    }
  }));

  return _.compact(fields);
};

export const CreateOperandForm: React.FC<CreateOperandFormProps> = (props) => {
  const openAPIV3Schema = _.get(props.customResourceDefinition, 'spec.validation.openAPIV3Schema.properties', {});

  const fields: OperandField[] = (!_.isEmpty(props.clusterServiceVersion)
    ? fieldsFor(props.providedAPI)
    : [])
    .map(field => {
      if (_.isEmpty(openAPIV3Schema)) {
        return field;
      }
      const schemaPath = field.path.split('.').join('.properties.');
      const required = (_.get(openAPIV3Schema, _.dropRight(['spec', ...field.path.split('.')]).join('.properties.').concat('.required'), []) as string[])
        .includes(_.last(field.path.split('.')));
      const type = _.get(openAPIV3Schema.spec.properties, schemaPath.concat('.type'));
      const validation = _.pick(_.get(openAPIV3Schema.spec.properties, schemaPath), [...Object.keys(Validations)]);

      return {...field, type, required, validation};
    })
    .concat(fieldsForOpenAPI(props.customResourceDefinition).filter(crdField => !props.providedAPI.specDescriptors.some(d => d.path === crdField.path)));

  const defaultValueFor = (field: OperandField) => {
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return {limits: {cpu: '', memory: ''}, requests: {cpu: '', memory: ''}};
    }
    if (field.capabilities.includes(SpecCapability.password)) {
      return '';
    }
    if (field.capabilities.some(c => c.startsWith(SpecCapability.k8sResourcePrefix))) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.checkbox)) {
      return false;
    }
    if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
      return false;
    }
    if (field.capabilities.includes(SpecCapability.imagePullPolicy)) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.text)) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.number)) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
      return _.cloneDeep(defaultNodeAffinity);
    }
    if (field.capabilities.includes(SpecCapability.podAffinity) || field.capabilities.includes(SpecCapability.podAntiAffinity)) {
      return _.cloneDeep(defaultPodAffinity);
    }
    return null;
  };

  type FormValues = {[path: string]: any};

  const defaultFormValues = fields.reduce((allFields, field) => ({...allFields, [field.path]: defaultValueFor(field)}), {} as FormValues);
  const sampleFormValues = fields.reduce((allFields, field) => {
    const sampleValue = _.get(props.sample, `spec.${field.path}`);
    return sampleValue ? {...allFields, [field.path]: sampleValue} : allFields;
  }, {} as FormValues);

  const [formValues, setFormValues] = React.useState<FormValues>({'metadata.name': 'example', 'metadata.labels': [], ...defaultFormValues, ...sampleFormValues});
  const [error, setError] = React.useState<string>();
  const [formErrors, setFormErrors] = React.useState<FieldErrors>({});

  const updateFormValues = (values: FormValues) => (path: PropertyPath, value: any) => _.set(_.cloneDeep(values), path, value);

  const submit = (event) => {
    event.preventDefault();

    const errors = fields.filter(f => !_.isNil(f.validation)).reduce((allErrors, field) => {
      // NOTE: Can't use server-side error response due to missing info (https://github.com/kubernetes/kubernetes/issues/80718)
      const fieldErrors = _.map(field.validation, (val, rule: Validations) => {
        switch (rule) {
          case Validations.minimum:
            return formValues[field.path] >= val ? null : `Must be greater than ${val}.`;
          case Validations.maximum:
            return formValues[field.path] <= val ? null : `Must be less than ${val}.`;
          case Validations.minLength:
            return formValues[field.path].length >= val ? null : `Must be at least ${val} characters.`;
          case Validations.maxLength:
            return formValues[field.path].length <= val ? null : `Must be greater than ${val} characters.`;
          case Validations.pattern:
            return new RegExp(val as string).test(formValues[field.path]) ? null : `Does not match required pattern ${val}`;
          default:
            return null;
        }
      });
      // Just use first error
      return {...allErrors, [field.path]: fieldErrors.find(e => !_.isNil(e))};
    }, {} as FieldErrors);
    setFormErrors(errors);

    if (_.isEmpty(_.compact(_.values(errors)))) {
      const specValues = fields.reduce((usedFormValues, field) => {
        const formValue = _.get(usedFormValues, field.path);
        if (_.isEqual(formValue, defaultValueFor(field)) || _.isNil(formValue)) {
          return _.omit(usedFormValues, field.path);
        }
        return usedFormValues;
      }, _.omit(formValues, ['metadata.name', 'metadata.labels']));

      const obj = {
        apiVersion: apiVersionForModel(props.operandModel),
        kind: props.operandModel.kind,
        metadata: {
          namespace: props.namespace,
          name: formValues['metadata.name'],
          labels: SelectorInput.objectify(formValues['metadata.labels']),
          annotations: _.get(props.sample, 'metadata.annotations', {}),
        },
        spec: _.reduce(specValues, (spec, value, path) => _.set(spec, path, value), _.get(props.sample, 'spec', {})),
      } as K8sResourceKind;

      k8sCreate(props.operandModel, obj)
        .then(() => history.push(`${resourcePathFromModel(ClusterServiceVersionModel, props.clusterServiceVersion.metadata.name, props.namespace)}/${referenceForModel(props.operandModel)}/${obj.metadata.name}`))
        .catch((err: {json: Status}) => {
          setError(err.json.message);
        });
    }
  };

  // TODO(alecmerdler): Move this into a single `<SpecDescriptorInput>` entry component in the `descriptors/` directory
  const inputFor = (field: OperandField) => {
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return <NumberSpinner
        id={field.path}
        className="pf-c-form-control"
        value={_.get(formValues, field.path)}
        onChange={({currentTarget}) => setFormValues(values => ({...values, [field.path]: _.toInteger(currentTarget.value)}))}
        changeValueBy={operation => setFormValues(values => ({...values, [field.path]: _.toInteger(formValues[field.path]) + operation}))}
        autoFocus
        required />;
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return <dl style={{marginLeft: '15px'}}>
        <dt>Limits</dt>
        <dd>
          <ResourceRequirements
            cpu={_.get(formValues, [field.path, 'limits', 'cpu'])}
            memory={_.get(formValues, [field.path, 'limits', 'memory'])}
            onChangeCPU={cpu => setFormValues(values => updateFormValues(values)([field.path, 'limits', 'cpu'], cpu))}
            onChangeMemory={memory => setFormValues(values => updateFormValues(values)([field.path, 'limits', 'memory'], memory))}
            path={`${field.path}.limits`} />
        </dd>
        <dt>Requests</dt>
        <dd>
          <ResourceRequirements
            cpu={_.get(formValues, [field.path, 'requests', 'cpu'])}
            memory={_.get(formValues, [field.path, 'requests', 'memory'])}
            onChangeCPU={cpu => setFormValues(values => updateFormValues(values)([field.path, 'requests', 'cpu'], cpu))}
            onChangeMemory={memory => setFormValues(values => updateFormValues(values)([field.path, 'requests', 'memory'], memory))}
            path={`${field.path}.requests`} />
        </dd>
      </dl>;
    }
    if (field.capabilities.includes(SpecCapability.password)) {
      return <input
        className="pf-c-form-control"
        id={field.path}
        type="password"
        {...field.validation}
        onChange={({currentTarget}) => setFormValues(values => ({...values, [field.path]: currentTarget.value}))}
        value={formValues[field.path]} />;
    }
    if (field.capabilities.some(c => c.startsWith(SpecCapability.k8sResourcePrefix))) {
      const groupVersionKind: GroupVersionKind = field.capabilities.find(c => c.startsWith(SpecCapability.k8sResourcePrefix)).split(SpecCapability.k8sResourcePrefix)[1];

      return <div style={{width: '50%'}}>
        <ListDropdown
          resources={[{kind: groupVersionKind, namespace: props.namespace}]}
          desc={field.description}
          placeholder={`Select ${kindForReference(groupVersionKind)}`}
          onChange={name => setFormValues(values => ({...values, [field.path]: name}))} />
      </div>;
    }
    if (field.capabilities.includes(SpecCapability.checkbox)) {
      return <input
        type="checkbox"
        id={field.path}
        style={{marginLeft: '10px'}}
        checked={formValues[field.path] as boolean}
        required={field.required}
        onChange={({currentTarget}) => setFormValues(values => ({...values, [field.path]: currentTarget.checked}))} />;
    }
    if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
      return <AsyncComponent
        loader={() => import('patternfly-react').then(m => m.Switch)}
        value={formValues[field.path]}
        onChange={(el, val) => setFormValues(values => ({...values, [field.path]: val}))}
        onText="True"
        offText="False"
        bsSize="mini" />;
    }
    if (field.capabilities.includes(SpecCapability.imagePullPolicy)) {
      return <RadioGroup
        currentValue={formValues[field.path]}
        items={_.values(ImagePullPolicy).map(policy => ({value: policy, title: policy}))}
        onChange={({currentTarget}) => setFormValues(values => ({...values, [field.path]: currentTarget.value}))} />;
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return <ConfigureUpdateStrategy
        strategyType={_.get(formValues, `${field.path}.type`)}
        maxUnavailable={_.get(formValues, `${field.path}.rollingUpdate.maxUnavailable`)}
        maxSurge={_.get(formValues, `${field.path}.rollingUpdate.maxSurge`)}
        onChangeStrategyType={type => setFormValues(values => updateFormValues(values)([field.path, 'type'], type))}
        onChangeMaxUnavailable={maxUnavailable => setFormValues(values => updateFormValues(values)([field.path, 'rollingUpdate', 'maxUnavailable'], maxUnavailable))}
        onChangeMaxSurge={maxSurge => setFormValues(values => updateFormValues(values)([field.path, 'rollingUpdate', 'maxSurge'], maxSurge))}
        replicas={1} />;
    }
    if (field.capabilities.includes(SpecCapability.text)) {
      return <div style={{width: '50%'}}>
        <input
          className="pf-c-form-control"
          id={field.path}
          type="text"
          onChange={({currentTarget}) => setFormValues(values => ({...values, [field.path]: currentTarget.value}))}
          value={formValues[field.path]} />
      </div>;
    }
    if (field.capabilities.includes(SpecCapability.number)) {
      return <div style={{width: '50%'}}>
        <input
          className="pf-c-form-control"
          id={field.path}
          type="number"
          onChange={({currentTarget}) => setFormValues(values => ({...values, [field.path]: currentTarget.value !== '' ? _.toNumber(currentTarget.value) : ''}))}
          value={formValues[field.path]} />
      </div>;
    }
    if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
      return <div style={{marginLeft: '15px'}}>
        <NodeAffinity affinity={formValues[field.path]} onChangeAffinity={affinity => setFormValues(values => ({...values, [field.path]: affinity}))} />
      </div>;
    }
    if (field.capabilities.includes(SpecCapability.podAffinity) || field.capabilities.includes(SpecCapability.podAntiAffinity)) {
      return <div style={{marginLeft: '15px'}}>
        <PodAffinity affinity={formValues[field.path]} onChangeAffinity={affinity => setFormValues(values => ({...values, [field.path]: affinity}))} />
      </div>;
    }
    return null;
  };

  const fieldGroups = fields.reduce((groups, field) => field.capabilities.find(c => c.startsWith(SpecCapability.fieldGroup))
    ? groups.add(field.capabilities.find(c => c.startsWith(SpecCapability.fieldGroup)))
    : groups,
  new Set());

  const arrayFieldGroups = fields.reduce((groups, field) => field.capabilities.find(c => c.startsWith(SpecCapability.arrayFieldGroup))
    ? groups.add(field.capabilities.find(c => c.startsWith(SpecCapability.arrayFieldGroup)))
    : groups,
  new Set());

  useScrollToTopOnMount();

  return <div className="co-m-pane__body">
    <form className="col-md-6" onSubmit={submit}>
      <div className="row">
        <div className="form-group">
          <label className="control-label co-required" htmlFor="name">Name</label>
          <input
            className="pf-c-form-control"
            type="text"
            onChange={({target}) => setFormValues(values => ({...values, 'metadata.name': target.value}))}
            value={formValues['metadata.name']}
            id="metadata.name"
            required />
        </div>
      </div>
      <div className="row">
        <div className="form-group">
          <label className="control-label" htmlFor="tags-input">Labels</label>
          <SelectorInput onChange={labels => setFormValues(values => ({...values, 'metadata.labels': labels}))} tags={formValues['metadata.labels']} />
        </div>
      </div>
      { [...arrayFieldGroups].map(group => <div key={group} className="row">
        <label className="form-label">{_.startCase(group.split(SpecCapability.arrayFieldGroup)[1])}</label>
        <div style={{marginLeft: '15px'}}>
          { fields.filter(f => f.capabilities.includes(group))
            .filter(f => !_.isNil(inputFor(f))).map(field => <div key={field.path}>
              <div className="form-group co-create-operand__form-group">
                <label className={classNames('form-label', {'co-required': field.required})} htmlFor={field.path}>{field.displayName}</label>
                { inputFor(field) }
                { field.description && <span id={`${field.path}__description`} className="help-block text-muted">{field.description}</span> }
                { formErrors[field.path] && <span className="co-error">{formErrors[field.path]}</span> }
              </div>
            </div>) }
        </div>
      </div>) }
      { [...fieldGroups].map(group => <div key={group} className="row">
        <label className="form-label">{_.startCase(group.split(SpecCapability.fieldGroup)[1])}</label>
        <div style={{marginLeft: '15px'}}>
          { fields.filter(f => f.capabilities.includes(group))
            .filter(f => !_.isNil(inputFor(f))).map(field => <div key={field.path}>
              <div className="form-group co-create-operand__form-group">
                <label className={classNames('form-label', {'co-required': field.required})} htmlFor={field.path}>{field.displayName}</label>
                { inputFor(field) }
                { field.description && <span id={`${field.path}__description`} className="help-block text-muted">{field.description}</span> }
                { formErrors[field.path] && <span className="co-error">{formErrors[field.path]}</span> }
              </div>
            </div>) }
        </div>
      </div>) }
      { fields.filter(f => !f.capabilities.some(c => c.startsWith(SpecCapability.fieldGroup) || c.startsWith(SpecCapability.arrayFieldGroup)))
        .filter(f => !_.isNil(inputFor(f))).map(field => <div className="row" key={field.path}>
          <div className="form-group co-create-operand__form-group">
            <label className={classNames('form-label', {'co-required': field.required})} htmlFor={field.path}>{field.displayName}</label>
            { inputFor(field) }
            { field.description && <span id={`${field.path}__description`} className="help-block text-muted">{field.description}</span> }
            { formErrors[field.path] && <span className="co-error">{formErrors[field.path]}</span> }
          </div>
        </div>) }
      {(!_.isEmpty(error) || !_.isEmpty(_.compact(_.values(formErrors)))) && <div className="row">
        <Alert isInline className="co-alert co-break-word" variant="danger" title={error || 'Fix above errors'} />
      </div>}
      <div className="row" style={{paddingBottom: '30px'}}>
        <ActionGroup className="pf-c-form">
          <Button
            onClick={submit}
            type="submit"
            variant="primary">
            Create
          </Button>
          <Button
            onClick={history.goBack}
            variant="secondary">
            Cancel
          </Button>
        </ActionGroup>
      </div>
    </form>
    <div className="col-md-6">
      { props.clusterServiceVersion && props.providedAPI && <div style={{marginBottom: '30px'}}>
        <ClusterServiceVersionLogo
          displayName={props.providedAPI.displayName}
          icon={_.get(props.clusterServiceVersion, 'spec.icon[0]')}
          provider={_.get(props.clusterServiceVersion, 'spec.provider')} />
        { props.providedAPI.description }
      </div> }
      <Alert isInline className="co-alert co-break-word" variant="info" title={'Note: Some fields may not be represented in this form. Please select "Edit YAML" for full control of object creation.'} />
    </div>
  </div>;
};

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateOperandYAML: React.FC<CreateOperandYAMLProps> = (props) => {
  const template = _.attempt(() => safeDump(props.sample));
  if (_.isError(template)) {
    // eslint-disable-next-line no-console
    console.error('Error parsing example JSON from annotation. Falling back to default.');
  }

  return <CreateYAML template={!_.isError(template) ? template : null} match={props.match} hideHeader={true} />;
};

export const CreateOperand: React.FC<CreateOperandProps> = (props) => {
  const providedAPI = () => providedAPIsFor(props.clusterServiceVersion.data).find(crd => referenceForProvidedAPI(crd) === referenceForModel(props.operandModel));
  const sample = () => JSON.parse(_.get(props.clusterServiceVersion.data.metadata.annotations, annotationKey, '[]'))
    .find((s: K8sResourceKind) => referenceFor(s) === referenceForModel(props.operandModel));
  const [method, setMethod] = React.useState<'yaml' | 'form'>('yaml');

  return <React.Fragment>
    { props.loaded && <div className="co-create-operand__header">
      <div className="co-create-operand__header-buttons">
        <BreadCrumbs breadcrumbs={[
          {name: props.clusterServiceVersion.data.spec.displayName, path: window.location.pathname.replace('/~new', '')},
          {name: `Create ${props.operandModel.label}`, path: window.location.pathname},
        ]} />
        <div style={{marginLeft: 'auto'}}>{
          method === 'form' && <Button variant="link" onClick={() => setMethod('yaml')}>Edit YAML</Button> ||
          method === 'yaml' && <Button variant="link" onClick={() => setMethod('form')}>Edit Form</Button>
        }</div>
      </div>
      <h1 className="co-create-operand__header-text">{`Create ${props.operandModel.label}`}</h1>
      <p className="help-block">{
        method === 'yaml' && 'Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.' ||
        method === 'form' && 'Create by completing the form. Default values may be provided by the Operator authors.'
      }</p>
    </div> }
    <StatusBox loaded={props.loaded} loadError={props.loadError} data={props.clusterServiceVersion}>{
      method === 'form' && <CreateOperandForm
        namespace={props.match.params.ns}
        operandModel={props.operandModel}
        providedAPI={providedAPI()}
        sample={props.loaded ? sample() : null}
        clusterServiceVersion={props.clusterServiceVersion.data}
        customResourceDefinition={props.customResourceDefinition.data} /> ||
      method === 'yaml' && <CreateOperandYAML
        match={props.match}
        sample={props.loaded ? sample() : null}
        operandModel={props.operandModel}
        providedAPI={providedAPI()}
        clusterServiceVersion={props.clusterServiceVersion.data} />
    }</StatusBox>
  </React.Fragment>;
};

const stateToProps = ({k8s}: RootState, props: Omit<CreateOperandPageProps, 'operandModel'>) => ({
  operandModel: k8s.getIn(['RESOURCES', 'models', props.match.params.plural]) as K8sKind,
});

export const CreateOperandPage = connect(stateToProps)((props: CreateOperandPageProps) => <React.Fragment>
  <Helmet>
    <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
  </Helmet>
  { props.operandModel && <Firehose resources={[{
    kind: referenceForModel(ClusterServiceVersionModel),
    name: props.match.params.appName,
    namespace: props.match.params.ns,
    isList: false,
    prop: 'clusterServiceVersion',
  }, {
    kind: CustomResourceDefinitionModel.kind,
    isList: false,
    name: nameForModel(props.operandModel),
    prop: 'customResourceDefinition',
  }]}>
    {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
    <CreateOperand {...props as any} operandModel={props.operandModel} match={props.match} />
  </Firehose> }
</React.Fragment>);

export type CreateOperandProps = {
  match: match<{appName: string, ns: string, plural: K8sResourceKindReference}>;
  operandModel: K8sKind;
  loaded: boolean;
  loadError?: any;
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition: FirehoseResult<CustomResourceDefinitionKind>;
};

export type CreateOperandFormProps = {
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  customResourceDefinition: CustomResourceDefinitionKind;
  sample?: K8sResourceKind;
  namespace: string;
};

export type CreateOperandYAMLProps = {
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  sample?: K8sResourceKind;
  match: match<{appName: string, ns: string, plural: K8sResourceKindReference}>;
};

export type CreateOperandPageProps = {
  match: match<{appName: string, ns: string, plural: K8sResourceKindReference}>;
  operandModel: K8sKind;
};

export type SpecDescriptorInputProps = {
  field: OperandField;
  sample?: K8sResourceKind;
};

CreateOperandPage.displayName = 'CreateOperandPage';
CreateOperand.displayName = 'CreateOperand';
CreateOperandForm.displayName = 'CreateOperandForm';
CreateOperandYAML.displayName = 'CreateOperandYAML';
