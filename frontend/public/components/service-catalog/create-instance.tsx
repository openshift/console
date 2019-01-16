/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { IChangeEvent, ISubmitEvent } from 'react-jsonschema-form';

import { ServiceInstanceModel, ClusterServiceClassModel, ClusterServicePlanModel } from '../../models';
import { ClusterServiceClassInfo } from '../cluster-service-class-info';
import { ButtonBar } from '../utils/button-bar';
import {
  k8sCreate,
  K8sResourceKind,
  referenceForModel,
} from '../../module/k8s';
import {
  createParametersSecret,
  getInstanceCreateParametersForm,
  getInstanceCreateSchema,
  getUISchema,
  ServiceCatalogParametersForm,
} from './schema-form';
import {
  Firehose,
  history,
  NsDropdown,
  PageHeading,
  resourcePathFromModel,
  StatusBox,
} from '../utils';

const PARAMETERS_SECRET_KEY = 'parameters';

const getAvailablePlans = (plans: any): any[] => _.reject(plans.data, 'status.removedFromBrokerCatalog');

class CreateInstance extends React.Component<CreateInstanceProps, CreateInstanceState> {
  constructor(props) {
    super(props);

    const { preselectedNamespace: namespace = ''} = this.props;
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
    this.setState({namespace});
  }

  onNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({name: event.currentTarget.value});
  }

  onPlanChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({plan: event.currentTarget.value});
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
      },
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
    const secretName = _.isEmpty(formData) ? null : `${this.state.name}-parameters`;

    // Create the instance first so we can set an ownerRef from the parameters secret to the instance.
    this.createInstance(secretName)
      .then(instance => secretName ? createParametersSecret(secretName, PARAMETERS_SECRET_KEY, formData, instance) : null)
      .then(() => {
        this.setState({inProgress: false});
        history.push(resourcePathFromModel(ServiceInstanceModel, name, namespace));
      }, err => this.setState({error: err.message, inProgress: false}));
  }

  render() {
    const { obj, plans, loaded, loadError } = this.props;

    const serviceClass = _.get(obj, 'data');
    const title = 'Create Service Instance';

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
      <StatusBox data={serviceClass} loaded={loaded} loadError={loadError} label="Service Class">
        <PageHeading title={title} />
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
      </StatusBox>
    </React.Fragment>;
  }
}

export const CreateInstancePage = (props) => {
  const searchParams = new URLSearchParams(location.search);
  const name = searchParams.get('cluster-service-class');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const resources = [
    {kind: referenceForModel(ClusterServiceClassModel), name, isList: false, prop: 'obj'},
    {kind: referenceForModel(ClusterServicePlanModel), isList: true, prop: 'plans', fieldSelector: `spec.clusterServiceClassRef.name=${name}`},
  ];
  return <Firehose resources={resources}>
    <CreateInstance preselectedNamespace={preselectedNamespace} {...props as any} />
  </Firehose>;
};

export type CreateInstanceProps = {
  obj: any,
  plans: any,
  loaded: any,
  loadError: boolean,
  match: any,
  preselectedNamespace: string,
};

export type CreateInstanceState = {
  name: string,
  namespace: string,
  plan: string,
  formData: any,
  inProgress: boolean,
  error?: any,
};
