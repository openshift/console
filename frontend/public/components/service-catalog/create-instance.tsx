/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { IChangeEvent, ISubmitEvent } from 'react-jsonschema-form';

import { createParametersSecret, getInstanceCreateSchema, getInstanceCreateParametersForm, ServiceCatalogParametersForm, getUISchema } from './schema-form';
import { LoadingBox } from '../utils/status-box';
import { history, Firehose, NavTitle, resourcePathFromModel } from '../utils';
import { ClusterServiceClassModel, ServiceInstanceModel } from '../../models';
import { k8sCreate, K8sResourceKind, serviceClassDisplayName } from '../../module/k8s';
import { NsDropdown } from '../RBAC/bindings';
import { ClusterServiceClassInfo } from '../cluster-service-class-info';
import { ButtonBar } from '../utils/button-bar';

const PARAMETERS_SECRET_KEY = 'parameters';

const getAvailablePlans = (plans: any): any[] => _.reject(plans.data, 'status.removedFromBrokerCatalog');

class CreateInstance extends React.Component<CreateInstanceProps, CreateInstanceState> {
  constructor (props) {
    super(props);

    const { preselectNamespace: namespace = ''} = this.props;
    this.state = {
      name: '',
      namespace,
      plan: '',
      formData: {},
      inProgress: false,
    };
  }

  static getDerivedStateFromProps(props: CreateInstanceProps, state: CreateInstanceState) {
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
  }

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

  onFormChange = ({formData}: IChangeEvent) => this.setState({formData})

  save = ({formData}: ISubmitEvent<any>) => {
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
      .then(instance => secretName ? createParametersSecret(secretName, PARAMETERS_SECRET_KEY, parameters, instance) : null)
      .then(() => {
        this.setState({inProgress: false});
        history.push(resourcePathFromModel(ServiceInstanceModel, name, namespace));
      }, err => this.setState({error: err.message, inProgress: false}));
  }

  render() {
    const { obj, plans, match } = this.props;
    if (!obj.loaded) {
      return <LoadingBox />;
    }

    const serviceClass = _.get(obj, 'data');
    const title = 'Create Service Instance';
    const displayName = serviceClassDisplayName(serviceClass);

    const { plan: selectedPlanName } = this.state;
    const availablePlans = getAvailablePlans(plans);
    const selectedPlan = _.find(availablePlans, { spec: { externalName: selectedPlanName } });
    const schema = getInstanceCreateSchema(selectedPlan);
    const parametersForm = getInstanceCreateParametersForm(selectedPlan);
    const uiSchema = getUISchema(parametersForm);

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
          {name: `${title}`, path: `${match.url}`}
        ]}
      />
      <div className="co-m-pane__body co-create-service-instance">
        <div className="row">
          <div className="col-md-7 col-md-push-5 co-catalog-item-info">
            <ClusterServiceClassInfo obj={serviceClass} />
          </div>
          <div className="col-md-5 col-md-pull-7">
            <form className="co-create-service-instance">
              <div className="form-group co-create-service-instance__namespace">
                <label className="control-label co-required" htmlFor="dropdown-selectbox">Namespace</label>
                <NsDropdown selectedKey={this.state.namespace} onChange={this.onNamespaceChange} id="dropdown-selectbox" />
              </div>
              <div className="form-group co-create-service-instance__name">
                <label className="control-label co-required" htmlFor="name">Service Instance Name</label>
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
            <ServiceCatalogParametersForm schema={schema} uiSchema={uiSchema} onSubmit={this.save} formData={this.state.formData} onChange={this.onFormChange}>
              <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
              </ButtonBar>
            </ServiceCatalogParametersForm>
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
}

export const CreateInstancePage: React.SFC<CreateInstancePageProps> = (props) => {
  const resources = [
    {kind: 'ClusterServiceClass', name: props.match.params.name, isList: false, prop: 'obj'},
    {kind: 'ClusterServicePlan', isList: true, prop: 'plans', fieldSelector: `spec.clusterServiceClassRef.name=${props.match.params.name}`},
  ];
  const searchParams = new URLSearchParams(location.search);
  const preselectNamespace = searchParams.get('preselect-ns');
  return <Firehose resources={resources}>
    <CreateInstance preselectNamespace={preselectNamespace} {...props as any} />
  </Firehose>;
};

export type CreateInstanceProps = {
  obj: any,
  plans: any,
  match: any,
  preselectNamespace: string,
};

export type CreateInstanceState = {
  name: string,
  namespace: string,
  plan: string,
  formData: any,
  inProgress: boolean,
  error?: any,
};

export type CreateInstancePageProps = {
  match: any,
};
