/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import * as _ from 'lodash-es';
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';

import { k8sList, K8sResourceKind, K8sResourceKindReference, planExternalName, serviceCatalogStatus } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, history, navFactory, ResourceCog, ResourceIcon, ResourceLink, ResourceSummary, SectionHeading, StatusWithIcon, Timestamp } from './utils';
import { ResourceEventStream } from './events';
import { Conditions } from './conditions';
import { ServiceCatalogParameters, ServiceCatalogParametersSecrets } from './service-catalog-parameters';
import { ServiceBindingsPage } from './service-binding';
import { ServiceBindingModel } from '../models';

const ServiceInstancesReference: K8sResourceKindReference = 'ServiceInstance';

const goToCreateBindingPage = (serviceInstance: K8sResourceKind) => {
  history.push(`/k8s/ns/${serviceInstance.metadata.namespace}/serviceinstances/${serviceInstance.metadata.name}/create-binding`);
};

const createBinding = (kindObj, serviceInstance) => {
  return {
    callback: () => goToCreateBindingPage(serviceInstance),
    label: 'Create Service Binding',
  };
};

const { common } = Cog.factory;

const menuActions = [
  createBinding,
  ...common,
];

export const ServiceBindingDescription: React.SFC<ServiceBindingDescriptionProps> = ({instanceName, className}) => <p className={className}>
  Service bindings create a secret containing the necessary information for a workload to use <ResourceIcon kind="ServiceInstance" />{instanceName}.
  Once the binding is ready, add the secret to your workload&apos;s environment variables or volumes.
</p>;

class ServiceInstanceMessage_ extends React.Component<ServiceInstanceMessageProps & RouteComponentProps<{}>, ServiceInstanceMessageState> {
  state = {
    hasBindings: false,
    loaded: false,
  };

  componentDidMount() {
    const {obj} = this.props;

    // Get the bindings for this service instance to know what messages to display.
    k8sList(ServiceBindingModel, {ns: obj.metadata.namespace})
      .then(serviceBindings => {
        const hasBindings = _.some(serviceBindings, {spec: {instanceRef: {name: obj.metadata.name}}});
        this.setState({ loaded: true, hasBindings });
      });
  }

  createBinding = () => {
    const {obj} = this.props;
    goToCreateBindingPage(obj);
  };

  render() {
    const {obj, match: {url}} = this.props;
    const {deletionTimestamp} = obj.metadata;
    const {loaded, hasBindings} = this.state;

    if (!loaded) {
      return null;
    }

    // Warn when the instance is deleted, but is still has bindings.
    if (deletionTimestamp && hasBindings) {
      const basePath = url.replace(/\/$/, '');
      return <p className="alert alert-warning co-service-instance-delete-bindings-warning">
        <i className="pficon pficon-warning-triangle-o" aria-hidden="true" />
        This service instance is marked for deletion, but still has bindings.
        You must delete the bindings before the instance will be deleted.&nbsp;&nbsp;
        <Link to={`${basePath}/servicebindings`}>View Service Bindings</Link>
      </p>;
    }

    // Show help for creating a binding when there are none for this instance.
    // TODO: Check if the plan is actually bindable.
    if (!deletionTimestamp && !hasBindings) {
      return <div className="co-well">
        <h4>Create Service Binding</h4>
        <ServiceBindingDescription instanceName={obj.metadata.name} />
        <button className="btn btn-primary" type="button" onClick={this.createBinding}>Create Service Binding</button>
      </div>;
    }

    return null;
  }
}
const ServiceInstanceMessage = withRouter(ServiceInstanceMessage_);

const ServiceInstanceDetails: React.SFC<ServiceInstanceDetailsProps> = ({obj: si}) => {
  const plan = planExternalName(si);
  const parameters = _.get(si, 'status.externalProperties.parameters', {});
  const classDisplayName = si.spec.clusterServiceClassExternalName || si.spec.serviceClassExternalName;
  const clusterServiceClassName = _.get(si, 'spec.clusterServiceClassRef.name');

  return <React.Fragment>
    <ServiceInstanceMessage obj={si} />
    <div className="co-m-pane__body">
      <SectionHeading text="Service Instance Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={si} showPodSelector={false} showNodeSelector={false} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Service Class</dt>
            <dd>
              {clusterServiceClassName
                ? <ResourceLink kind="ClusterServiceClass" displayName={classDisplayName} title={classDisplayName} name={clusterServiceClassName} />
                : classDisplayName}
            </dd>
            <dt>Status</dt>
            <dd><StatusWithIcon obj={si} /></dd>
            <dt>Plan</dt>
            <dd>{plan || '-'}</dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={si.status.conditions} />
    </div>
    {!_.isEmpty(si.spec.parametersFrom) && <ServiceCatalogParametersSecrets obj={si} /> }
    {!_.isEmpty(parameters) && <ServiceCatalogParameters parameters={parameters} /> }
  </React.Fragment>;
};

const ServiceBindingsDetails: React.SFC<ServiceBindingsDetailsProps> = ({obj: si}) => {
  const bindingFilters = {selector: {field: 'spec.instanceRef.name', values: new Set(_.map(si, 'name'))}};

  return <ServiceBindingsPage canCreate={true} createHandler={() => goToCreateBindingPage(si)} namespace={si.metadata.namespace} filters={bindingFilters} autoFocus={false} showTitle={false} />;
};

const pages = [
  navFactory.details(ServiceInstanceDetails),
  navFactory.editYaml(),
  navFactory.events(ResourceEventStream),
  navFactory.serviceBindings(ServiceBindingsDetails),
];

export const ServiceInstanceDetailsPage: React.SFC<ServiceInstanceDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={ServiceInstancesReference}
    menuActions={menuActions}
    pages={pages} />;
ServiceInstanceDetailsPage.displayName = 'ServiceInstanceDetailsPage';

const ServiceInstancesHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-2 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 hidden-xs" sortField="spec.clusterServiceClassExternalName">Service Class</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-2 hidden-xs" sortFunc="serviceCatalogStatus">Status</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="planExternalName">Plan</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const ServiceInstancesRow: React.SFC<ServiceInstancesRowProps> = ({obj}) => {
  const clusterServiceClassRefName = _.get(obj, 'spec.clusterServiceClassRef.name');

  return <div className="row co-resource-list__item">
    <div className="col-md-2 col-sm-4 col-xs-6">
      <ResourceLink kind={ServiceInstancesReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-md-2 col-sm-3 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
    </div>
    <div className="col-md-2 col-sm-3 hidden-xs co-break-word">
      {clusterServiceClassRefName
        ? <ResourceLink kind="ClusterServiceClass" displayName={obj.spec.clusterServiceClassExternalName} title={obj.spec.clusterServiceClassExternalName} name={obj.spec.clusterServiceClassRef.name} />
        : obj.spec.clusterServiceClassExternalName }
    </div>
    <div className="col-md-2 col-sm-2 hidden-xs">
      <StatusWithIcon obj={obj} />
    </div>
    <div className="col-md-2 hidden-sm hidden-xs co-break-word">
      {planExternalName(obj) || '-'}
    </div>
    <div className="col-md-2 hidden-sm hidden-xs co-break-word">
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </div>
    <div className="co-resource-kebab">
      <ResourceCog actions={menuActions} kind={ServiceInstancesReference} resource={obj} />
    </div>
  </div>;
};

const ServiceInstancesList: React.SFC = props => <List {...props} Header={ServiceInstancesHeader} Row={ServiceInstancesRow} />;
ServiceInstancesList.displayName = 'ServiceInstancesList';

const filters = [{
  type: 'catalog-status',
  selected: ['Ready', 'Not Ready', 'Failed'],
  reducer: serviceCatalogStatus,
  items: [
    {id: 'Ready', title: 'Ready'},
    {id: 'Not Ready', title: 'Not Ready'},
    {id: 'Failed', title: 'Failed'},
  ],
}];

export const ServiceInstancesPage: React.SFC<ServiceInstancesPageProps> = props =>
  <ListPage
    {...props}
    kind={ServiceInstancesReference}
    ListComponent={ServiceInstancesList}
    filterLabel="Service Instances by name"
    rowFilters={filters}
  />;
ServiceInstancesPage.displayName = 'ServiceInstancesListPage';

export type ServiceInstanceStatusProps = {
  obj: K8sResourceKind
};

export type ServiceInstancesRowProps = {
  obj: K8sResourceKind,
};

export type ServiceInstanceDetailsProps = {
  obj: K8sResourceKind,
};

export type ServiceBindingDescriptionProps = {
  instanceName: string,
  className?: string,
};

export type ServiceInstanceMessageProps = {
  obj: K8sResourceKind,
};

export type ServiceInstanceMessageState = {
  hasBindings: boolean,
  loaded: boolean,
};

export type ServiceBindingsDetailsProps = {
  obj: any,
};

export type ServiceInstancesPageProps = {
  showTitle?: boolean,
  namespace?: string,
  selector?: any,
};

export type ServiceInstanceDetailsPageProps = {
  match: any,
};
