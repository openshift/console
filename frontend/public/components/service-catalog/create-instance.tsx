/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { LoadingBox } from '../utils/status-box';
import { history, Firehose, kindObj, NavTitle, resourcePathFromModel } from '../utils';
import { ClusterServiceClassModel, ServiceInstanceModel } from '../../models';
import { k8sCreate, serviceClassDisplayName } from '../../module/k8s';
import { NsDropdown } from '../RBAC/bindings';
import { ClusterServiceClassInfo } from '../cluster-service-class-info';
import { ButtonBar } from '../utils/button-bar';

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

  onNamespaceChange = namespace => {
    this.setState({namespace: namespace});
  };

  onNameChange = event => {
    this.setState({name: event.target.value});
  }

  onPlanChange = event => {
    this.setState({plan: event.target.value});
  }

  save = (e) => {
    e.preventDefault();
    if (!this.state.name || !this.state.namespace || !this.state.plan) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }
    this.setState({inProgress: true});
    const newServiceInstance = {
      apiVersion: 'servicecatalog.k8s.io/v1beta1',
      kind: 'ServiceInstance',
      metadata: {
        name: this.state.name,
        namespace: this.state.namespace,
      },
      spec: {
        clusterServiceClassExternalName: _.get(this.props.obj, 'data.spec.externalName'),
        clusterServicePlanExternalName: this.state.plan,
      }
    };
    const ko = kindObj('ServiceInstance');
    k8sCreate(ko, newServiceInstance).then(() => {
      this.setState({inProgress: false});
      history.push(resourcePathFromModel(ServiceInstanceModel, newServiceInstance.metadata.name, newServiceInstance.metadata.namespace));
    }, err => this.setState({error: err.message, inProgress: false}));
  };

  render() {
    const { obj, plans, match } = this.props;
    const serviceClass = _.get(obj, 'data');
    const scPlans = getAvailablePlans(plans);
    const title = 'Create Instance';
    const displayName = serviceClassDisplayName(serviceClass);

    if (!obj.loaded) {
      return <LoadingBox />;
    }

    const scPlanOptions = _.map(scPlans, plan => {
      return <div className="radio co-create-service-instance__plan" key={plan.spec.externalName}>
        <label>
          <input type="radio" name="plan" id="plan" value={plan.spec.externalName} checked={this.state.plan === plan.spec.externalName} onChange={this.onPlanChange} />
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
          {name: 'Create Instance', path: `${match.url}`}
        ]}
      />
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-7 col-md-push-5 co-cluster-service-instance-info">
            <ClusterServiceClassInfo obj={serviceClass} />
          </div>
          <div className="col-md-5 col-md-pull-7">
            <form className="co-create-service-instance" onSubmit={this.save}>
              <div className="form-group co-create-service-instance__namespace">
                <label className="control-label" htmlFor="dropdown-selectbox">Namespace</label>
                <NsDropdown selectedKey={this.state.namespace} onChange={this.onNamespaceChange} id="dropdown-selectbox" />
              </div>
              <div className="form-group co-create-service-instance__name">
                <label className="control-label" htmlFor="name">Service Instance Name</label>
                <input className="form-control"
                  type="text"
                  onChange={this.onNameChange}
                  value={this.state.name}
                  id="name"
                  required />
              </div>
              <div className="form-group co-create-service-instance__plans">
                <label className="control-label">Plans</label>
                {_.isEmpty(scPlans)
                  ? <p>There are no plans currently available for this service.</p>
                  : scPlanOptions}
              </div>
              <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
                <button type="submit" className="btn btn-primary">Create</button>
                <Link to={resourcePathFromModel(ClusterServiceClassModel, serviceClass.metadata.name)} className="btn btn-default">Cancel</Link>
              </ButtonBar>
            </form>
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
