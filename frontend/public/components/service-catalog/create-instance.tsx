/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Form from 'react-jsonschema-form';

import { LoadingBox } from '../utils/status-box';
import { history, Firehose, NavTitle, resourcePathFromModel } from '../utils';
import { ClusterServiceClassModel, SecretModel, ServiceInstanceModel } from '../../models';
import { k8sCreate, K8sResourceKind, serviceClassDisplayName } from '../../module/k8s';
import { NsDropdown } from '../RBAC/bindings';
import { ClusterServiceClassInfo } from '../cluster-service-class-info';
import { ButtonBar } from '../utils/button-bar';

const PARAMETERS_SECRET_KEY = 'parameters';

const getAvailablePlans = (plans: any[]): any[] => _.reject(_.get(plans, 'data'), plan => plan.status.removedFromBrokerCatalog);

class CreateInstanceForm extends React.Component<CreateInstanceFormProps, CreateInstanceFormState> {
  constructor (props) {
    super(props);

    this.state = {
      name: '',
      namespace: '',
      plan: '',
      inProgress: false,
    };

    this.onNamespaceChange = this.onNamespaceChange.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.save = this.save.bind(this);
  }

  static getDerivedStateFromProps(props: CreateInstanceFormProps, state: CreateInstanceFormState) {
    const { name, plan } = state;
    const { obj, plans } = props;
    const newState: any = {};

    const defaultName = _.get(obj, 'data.spec.externalName');
    if (!name && defaultName) {
      newState.name = defaultName;
    }

    const defaultPlan = _.get(getAvailablePlans(plans), '[0].spec.externalName');
    if (!plan && defaultPlan) {
      newState.plan = defaultPlan;
    }

    return newState;
  }

  onNamespaceChange = (namespace: string) => {
    this.setState({namespace: namespace});
  };

  onNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({name: event.currentTarget.value});
  }

  onPlanChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({plan: event.currentTarget.value});
  }

  asParameters = (formData: any): any => {
    // Omit parameters values that are the empty string. These are always
    // optional parameters since you can't submit the form when it's missing
    // required values. The template broker will not generate values for
    // "generated" parameters that are there, even if the value is empty
    // string, which breaks many templates.
    //
    // Check specifically for the empty string rather than truthiness so that
    // we don't omit other values like `false` for boolean parameters.
    return _.omitBy(formData, value => value === '');
  }

  createInstance = (secretName: string): Promise<K8sResourceKind> => {
    const parametersFrom = secretName ? [{ secretKeyRef: { name: secretName, key: PARAMETERS_SECRET_KEY } }] : [];
    const serviceInstance: K8sResourceKind = {
      apiVersion: 'servicecatalog.k8s.io/v1beta1',
      kind: 'ServiceInstance',
      metadata: {
        name: this.state.name,
        namespace: this.state.namespace,
      },
      spec: {
        clusterServiceClassExternalName: _.get(this.props.obj, 'data.spec.externalName'),
        clusterServicePlanExternalName: this.state.plan,
        parametersFrom,
      }
    };

    return k8sCreate(ServiceInstanceModel, serviceInstance);
  }

  createParametersSecret = (instance: K8sResourceKind, secretName: string, parameters: any): Promise<K8sResourceKind> => {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: secretName,
        namespace: instance.metadata.namespace,
        ownerReferences: [{
          apiVersion: instance.apiVersion,
          kind: instance.kind,
          name: instance.metadata.name,
          uid: instance.metadata.uid,
          controller: false,
          blockOwnerDeletion: false
        }],
      },
      stringData: {
        [PARAMETERS_SECRET_KEY]: JSON.stringify(parameters),
      },
    };

    return k8sCreate(SecretModel, secret);
  };

  save = ({formData}) => {
    const { name, namespace, plan } = this.state;
    if (!name || !namespace || !plan) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }

    this.setState({inProgress: true});
    const parameters = this.asParameters(formData);
    const secretName = _.isEmpty(parameters) ? null : `${this.state.name}-parameters`;

    // Create the instance first so we can set an ownerRef from the parameters secret to the instance.
    this.createInstance(secretName)
      .then(instance => secretName ? this.createParametersSecret(instance, secretName, parameters) : null)
      .then(() => {
        this.setState({inProgress: false});
        history.push(resourcePathFromModel(ServiceInstanceModel, name, namespace));
      }, err => this.setState({error: err.message, inProgress: false}));
  };

  render() {
    const { obj, plans, match } = this.props;
    if (!obj.loaded) {
      return <LoadingBox />;
    }

    const serviceClass = _.get(obj, 'data');
    const title = 'Create Instance';
    const displayName = serviceClassDisplayName(serviceClass);

    const { plan: selectedPlanName } = this.state;
    const availablePlans = getAvailablePlans(plans);
    const selectedPlan = _.find(availablePlans, { spec: { externalName: selectedPlanName } });
    const parameters = _.get(selectedPlan, 'spec.instanceCreateParameterSchema', { type: 'object', properties: {} });

    const planOptions = _.map(availablePlans, plan => {
      return <div className="radio co-create-service-instance__plan" key={plan.spec.externalName}>
        <label>
          <input type="radio" name="plan" id="plan" value={plan.spec.externalName} checked={selectedPlanName === plan.spec.externalName} onChange={this.onPlanChange} />
          {plan.spec.externalMetadata.displayName || plan.spec.externalName}
          {plan.spec.description && <div className="text-muted">{plan.spec.description}</div>}
        </label>
      </div>;
    });

    return <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <NavTitle
        title={title}
        obj={obj}
        breadcrumbsFor={() => [
          {name: displayName, path: resourcePathFromModel(ClusterServiceClassModel, serviceClass.metadata.name)},
          {name: title, path: `${match.url}`}
        ]}
      />
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-7 col-md-push-5 co-cluster-service-instance-info">
            <ClusterServiceClassInfo obj={serviceClass} />
          </div>
          <div className="col-md-5 col-md-pull-7">
            <form className="co-create-service-instance">
              <div className="form-group co-create-service-instance__namespace">
                {/* Use the same required style as used by react-jsonschema-form for consistency. */}
                <label className="control-label" htmlFor="dropdown-selectbox">Namespace<span className="required">*</span></label>
                <NsDropdown selectedKey={this.state.namespace} onChange={this.onNamespaceChange} id="dropdown-selectbox" />
              </div>
              <div className="form-group co-create-service-instance__name">
                <label className="control-label" htmlFor="name">Service Instance Name<span className="required">*</span></label>
                <input className="form-control"
                  type="text"
                  onChange={this.onNameChange}
                  value={this.state.name}
                  id="name"
                  required />
              </div>
              <div className="form-group co-create-service-instance__plans">
                <label className="control-label">Plans</label>
                {_.isEmpty(availablePlans)
                  ? <p>There are no plans currently available for this service.</p>
                  : planOptions}
              </div>
            </form>
            <Form schema={parameters} onSubmit={this.save}>
              <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
                <button type="submit" className="btn btn-primary">Create</button>
                <Link to={resourcePathFromModel(ClusterServiceClassModel, serviceClass.metadata.name)} className="btn btn-default">Cancel</Link>
              </ButtonBar>
            </Form>
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
}

export const CreateInstance = (props) => {
  const resources = [
    {kind: 'ClusterServiceClass', name: props.match.params.name, isList: false, prop: 'obj', poll: true},
    {kind: 'ClusterServicePlan', isList: true, prop: 'plans', fieldSelector: `spec.clusterServiceClassRef.name=${props.match.params.name}`}
  ];
  return <Firehose resources={resources}>
    <CreateInstanceForm {...props} />
  </Firehose>;
};

export type CreateInstanceFormProps = {
  obj: any,
  plans: any,
  match: any,
};

export type CreateInstanceFormState = {
  name: string,
  namespace: string,
  plan: string,
  inProgress: boolean,
  error?: any,
};
