import * as React from 'react';
import { connect } from 'react-redux';
import { match } from 'react-router';
import { Helmet } from 'react-helmet';
import { safeDump } from 'js-yaml';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';
import { Alert } from '@patternfly/react-core';

import {
  K8sResourceKindReference,
  referenceForModel,
  referenceFor,
  kindForReference,
  K8sKind,
  K8sResourceKind,
  apiVersionForModel,
  k8sCreate,
  Status,
} from '../../module/k8s';
import { ClusterServiceVersionKind, referenceForProvidedAPI, providedAPIsFor, CRDDescription, ClusterServiceVersionLogo, APIServiceDefinition } from './index';
import { ClusterServiceVersionModel } from '../../models';
import { Firehose } from '../utils/firehose';
import { NumberSpinner, StatusBox, BreadCrumbs, history, SelectorInput } from '../utils';
import { SpecCapability, StatusCapability } from './descriptors/types';
import { ResourceRequirements } from './descriptors/spec/resource-requirements';
import { RootState } from '../../redux';
import { CreateYAML } from '../create-yaml';

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

const fieldsFor = (providedAPI: CRDDescription) => providedAPI.specDescriptors.map(desc => ({
  path: desc.path,
  displayName: desc.displayName,
  description: desc.description,
  // TODO(alecmerdler): Grab the type from JSONSchema, but could need to deep access `properties` in order to get to it...
  type: null,
  capabilities: desc['x-descriptors'],
})) as OperandField[];

export const CreateOperandForm: React.FC<CreateOperandFormProps> = (props) => {
  type FormValues = {[path: string]: any};
  const [formValues, setFormValues] = React.useState<FormValues>({'metadata.name': 'example', 'metadata.labels': []});
  const [error, setError] = React.useState();

  const fields: OperandField[] = !_.isEmpty(props.clusterServiceVersion)
    ? fieldsFor(providedAPIsFor(props.clusterServiceVersion).find(desc => referenceForProvidedAPI(desc) === referenceForProvidedAPI(props.providedAPI)))
    : [];

  const submit = (e) => {
    e.preventDefault();

    const obj = {
      apiVersion: apiVersionForModel(props.operandModel),
      kind: props.operandModel.kind,
      metadata: {
        namespace: props.namespace,
        name: formValues['metadata.name'],
        labels: SelectorInput.objectify(formValues['metadata.labels']),
      },
      spec: _.reduce(_.omitBy(formValues, (val, path) => path.startsWith('metadata')), (spec, value, path) => _.set(spec, path, value), {}),
    } as K8sResourceKind;

    k8sCreate(props.operandModel, obj)
      .then(() => history.push(`/k8s/ns/${props.namespace}/clusterserviceversions/${props.clusterServiceVersion.metadata.name}/${referenceForModel(props.operandModel)}/${obj.metadata.name}`))
      .catch((err: Status) => setError(err.message));
  };

  const inputFor = (field: OperandField) => {
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return <NumberSpinner
        className="form-control"
        value={_.get(formValues, field.path, 1)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormValues({...formValues, [field.path]: _.toInteger(e.target.value)})}
        changeValueBy={operation => setFormValues({...formValues, [field.path]: _.toInteger(formValues[field.path]) + operation})}
        autoFocus
        required />;
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return <dl style={{marginLeft: '15px'}}>
        <dt>Limits</dt>
        <dd>
          <ResourceRequirements
            cpu={formValues[`${field.path}.limits.cpu`] as string}
            memory={formValues[`${field.path}.limits.memory`] as string}
            onChangeCPU={cpu => setFormValues({...formValues, [`${field.path}.cpu`]: cpu})}
            onChangeMemory={memory => setFormValues({...formValues, [`${field.path}.memory`]: memory})} />
        </dd>
        <dt>Requests</dt>
        <dd>
          <ResourceRequirements
            cpu={formValues[`${field.path}.requests.cpu`] as string}
            memory={formValues[`${field.path}.requests.memory`] as string}
            onChangeCPU={cpu => setFormValues({...formValues, [`${field.path}.cpu`]: cpu})}
            onChangeMemory={memory => setFormValues({...formValues, [`${field.path}.memory`]: memory})} />
        </dd>
      </dl>;
    }
    return null;
  };

  return <div className="co-m-pane__body">
    <form className="col-md-4" onSubmit={submit}>
      <div className="row">
        <div className="form-group">
          <label className="control-label co-required" htmlFor="name">Name</label>
          <input
            className="form-control"
            type="text"
            onChange={e => setFormValues({...formValues, 'metadata.name': e.target.value})}
            value={formValues['metadata.name']}
            id="name"
            required />
        </div>
      </div>
      <div className="row">
        <div className="form-group">
          <label className="control-label" htmlFor="tags-input">Labels</label>
          <SelectorInput onChange={labels => setFormValues({...formValues, 'metadata.labels': labels})} tags={formValues['metadata.labels']} />
        </div>
      </div>
      { fields.filter(f => !_.isNil(inputFor(f))).map(field => <div className="row" key={field.path}>
        <div className="form-group">
          <label className="form-label co-required" htmlFor={field.path}>{field.displayName}</label>
          { inputFor(field) }
          { field.description && <span className="help-block text-muted">{field.description}</span> }
        </div>
      </div>)}
      {error && <div className="row">
        <Alert isInline className="co-alert co-break-word" variant="danger" title={error} />
      </div>}
      <div className="row">
        <button className="btn btn-primary" type="submit" onClick={submit}>Create</button>
        <Link className="btn btn-default" to={`/k8s/ns/${props.namespace}/clusterserviceversions/${props.clusterServiceVersion.metadata.name}/${referenceForModel(props.operandModel)}`}>Cancel</Link>
      </div>
    </form>
    <div className="col-md-8">
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
          method === 'form' && <button className="btn btn-link" onClick={() => setMethod('yaml')}>Edit YAML</button> ||
          method === 'yaml' && <button className="btn btn-link" onClick={() => setMethod('form')}>Edit Form</button>
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

CreateOperandPage.displayName = 'CreateOperandPage';
CreateOperand.displayName = 'CreateOperand';
CreateOperandForm.displayName = 'CreateOperandForm';
CreateOperandYAML.displayName = 'CreateOperandYAML';
