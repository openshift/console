import * as React from 'react';
import { connect } from 'react-redux';
import { match } from 'react-router';
import { Helmet } from 'react-helmet';
import { safeDump } from 'js-yaml';
import * as _ from 'lodash-es';
import { Alert, ActionGroup, Button } from '@patternfly/react-core';

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
} from '../../module/k8s';
import { ClusterServiceVersionKind, referenceForProvidedAPI, providedAPIsFor, CRDDescription, ClusterServiceVersionLogo, APIServiceDefinition } from './index';
import { ClusterServiceVersionModel } from '../../models';
import { Firehose } from '../utils/firehose';
import { NumberSpinner, StatusBox, BreadCrumbs, history, SelectorInput, ListDropdown, AsyncComponent } from '../utils';
import { SpecCapability, StatusCapability, Descriptor } from './descriptors/types';
import { ResourceRequirements } from './descriptors/spec/resource-requirements';
import { RootState } from '../../redux';
import { CreateYAML } from '../create-yaml';
import { RadioGroup } from '../radio';
import { ConfigureUpdateStrategy } from '../modals/configure-update-strategy-modal';
import { NodeAffinity, PodAffinity } from './descriptors/spec/affinity';

const annotationKey = 'alm-examples';

/**
 * Combines OLM descriptor with JSONSchema.
 */
type OperandField = {
  path: string;
  displayName: string;
  description: string;
  type: string;
  capabilities: (SpecCapability | StatusCapability)[];
};

const fieldsFor = (providedAPI: CRDDescription) => _.get(providedAPI, 'specDescriptors', [] as Descriptor[]).map(desc => ({
  path: desc.path,
  displayName: desc.displayName,
  description: desc.description,
  // TODO(alecmerdler): Grab the type from JSONSchema, but could need to deep access `properties` in order to get to it...
  type: null,
  capabilities: desc['x-descriptors'],
})) as OperandField[];

export const CreateOperandForm: React.FC<CreateOperandFormProps> = (props) => {
  const fields: OperandField[] = !_.isEmpty(props.clusterServiceVersion)
    ? fieldsFor(providedAPIsFor(props.clusterServiceVersion).find(desc => referenceForProvidedAPI(desc) === referenceForProvidedAPI(props.providedAPI)))
    : [];

  const defaultValueFor = (field: OperandField) => {
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return 1;
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
      return ImagePullPolicy.IfNotPresent;
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return 'Rolling';
    }
    if (field.capabilities.includes(SpecCapability.text)) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.number)) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.podAffinity) || field.capabilities.includes(SpecCapability.podAntiAffinity)) {
      return null;
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
  const [error, setError] = React.useState();

  const updateFormValues = (values: FormValues) => (path: string, value: any) => {
    return _.set(_.cloneDeep(values), path, value);
  };

  const submit = (e) => {
    e.preventDefault();

    const specValues = _.omitBy(formValues, (val, path) => path.startsWith('metadata') || _.isNil(val));

    const obj = {
      apiVersion: apiVersionForModel(props.operandModel),
      kind: props.operandModel.kind,
      metadata: {
        namespace: props.namespace,
        name: formValues['metadata.name'],
        labels: SelectorInput.objectify(formValues['metadata.labels']),
      },
      spec: _.reduce(specValues, (spec, value, path) => _.set(spec, path, value), {}),
    } as K8sResourceKind;

    k8sCreate(props.operandModel, obj)
      .then(() => history.push(`/k8s/ns/${props.namespace}/clusterserviceversions/${props.clusterServiceVersion.metadata.name}/${referenceForModel(props.operandModel)}/${obj.metadata.name}`))
      .catch((err: Status) => setError(err.message));
  };

  // TODO(alecmerdler): Move this into a single `<SpecDescriptorInput>` entry component in the `descriptors/` directory
  const inputFor = (field: OperandField) => {
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return <NumberSpinner
        className="pf-c-form-control"
        value={_.get(formValues, field.path)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormValues(values => ({...values, [field.path]: _.toInteger(e.target.value)}))}
        changeValueBy={operation => setFormValues(values => ({...values, [field.path]: _.toInteger(formValues[field.path]) + operation}))}
        autoFocus
        required />;
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return <dl style={{marginLeft: '15px'}}>
        <dt>Limits</dt>
        <dd>
          <ResourceRequirements
            cpu={_.get(formValues, `${field.path}.limits.cpu`)}
            memory={_.get(formValues, `${field.path}.limits.memory`)}
            onChangeCPU={cpu => setFormValues(values => updateFormValues(values)(`${field.path}.limits.cpu`, cpu))}
            onChangeMemory={memory => setFormValues(values => updateFormValues(values)(`${field.path}.limits.memory`, memory))} />
        </dd>
        <dt>Requests</dt>
        <dd>
          <ResourceRequirements
            cpu={_.get(formValues, `${field.path}.requests.cpu`)}
            memory={_.get(formValues, `${field.path}.requests.memory`)}
            onChangeCPU={cpu => setFormValues(values => updateFormValues(values)(`${field.path}.requests.cpu`, cpu))}
            onChangeMemory={memory => setFormValues(values => updateFormValues(values)(`${field.path}.requests.memory`, memory))} />
        </dd>
      </dl>;
    }
    if (field.capabilities.includes(SpecCapability.password)) {
      return <input
        className="pf-c-form-control"
        id={field.path}
        type="password"
        onChange={e => setFormValues(values => ({...values, [field.path]: e.target.value}))}
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
        onChange={e => setFormValues(values => ({...values, [field.path]: e.target.checked}))} />;
    }
    if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
      return <div>
        <AsyncComponent
          loader={() => import('patternfly-react').then(m => m.Switch)}
          value={formValues[field.path]}
          onChange={(el, val) => setFormValues(values => ({...values, [field.path]: val}))}
          onText="True"
          offText="False"
          bsSize="mini" />
      </div>;
    }
    if (field.capabilities.includes(SpecCapability.imagePullPolicy)) {
      return <RadioGroup
        currentValue={formValues[field.path]}
        items={_.values(ImagePullPolicy).map(policy => ({value: policy, title: policy}))}
        onChange={e => setFormValues(values => ({...values, [field.path]: e.currentTarget.value}))} />;
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return <ConfigureUpdateStrategy
        strategyType={formValues[`${field.path}.type`]}
        maxUnavailable={formValues[`${field.path}.rollingUpdate.maxUnavailable`]}
        maxSurge={formValues[`${field.path}.rollingUpdate.maxSurge`]}
        onChangeStrategyType={type => setFormValues(values => ({...values, [`${field.path}.type`]: type}))}
        onChangeMaxUnavailable={maxUnavailable => setFormValues(values => ({...values, [`${field.path}.rollingUpdate.maxUnavailable`]: maxUnavailable}))}
        onChangeMaxSurge={maxSurge => setFormValues(values => ({...values, [`${field.path}.rollingUpdate.maxSurge`]: maxSurge}))}
        replicas={1} />;
    }
    if (field.capabilities.includes(SpecCapability.text)) {
      return <div style={{width: '50%'}}>
        <input
          className="pf-c-form-control"
          id={field.path}
          type="text"
          onChange={e => setFormValues(values => ({...values, [field.path]: e.currentTarget.value}))}
          value={formValues[field.path]} />
      </div>;
    }
    if (field.capabilities.includes(SpecCapability.number)) {
      return <div style={{width: '50%'}}>
        <input
          className="pf-c-form-control"
          id={field.path}
          type="number"
          onChange={e => setFormValues(values => ({...values, [field.path]: _.toInteger(e.currentTarget.value)}))}
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

  return <div className="co-m-pane__body">
    <form className="col-md-6" onSubmit={submit}>
      <div className="row">
        <div className="form-group">
          <label className="control-label co-required" htmlFor="name">Name</label>
          <input
            className="pf-c-form-control"
            type="text"
            onChange={e => setFormValues(values => ({...values, 'metadata.name': e.currentTarget.value}))}
            value={formValues['metadata.name']}
            id="name"
            required />
        </div>
      </div>
      <div className="row">
        <div className="form-group">
          <label className="control-label" htmlFor="tags-input">Labels</label>
          <SelectorInput onChange={labels => setFormValues(values => ({...values, 'metadata.labels': labels}))} tags={formValues['metadata.labels']} />
        </div>
      </div>
      { fields.filter(f => !_.isNil(inputFor(f))).map(field => <div className="row" key={field.path}>
        <div className="form-group">
          <label className="form-label" htmlFor={field.path}>{field.displayName}</label>
          { inputFor(field) }
          { field.description && <span className="help-block text-muted">{field.description}</span> }
        </div>
      </div>)}
      {error && <div className="row">
        <Alert isInline className="co-alert co-break-word" variant="danger" title={error} />
      </div>}
      <div className="row">
        <ActionGroup className="pf-c-form">
          <Button
            onClick={submit}
            type="submit"
            variant="primary">
            Create
          </Button>
          <Button
            component="a"
            href={`/k8s/ns/${props.namespace}/clusterserviceversions/${props.clusterServiceVersion.metadata.name}/${referenceForModel(props.operandModel)}`}
            variant="secondary">
            Cancel
          </Button>
        </ActionGroup>
      </div>
    </form>
    <div className="col-md-6">
      { props.clusterServiceVersion && props.providedAPI && <div>
        <ClusterServiceVersionLogo
          displayName={props.providedAPI.displayName}
          icon={_.get(props.clusterServiceVersion, 'spec.icon[0]')}
          provider={_.get(props.clusterServiceVersion, 'spec.provider')} />
        { props.providedAPI.description }
      </div> }
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
        clusterServiceVersion={props.clusterServiceVersion.data} /> ||
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
  clusterServiceVersion: {data: ClusterServiceVersionKind, loaded: boolean};
};

export type CreateOperandFormProps = {
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
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
