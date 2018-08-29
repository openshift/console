/* eslint-disable no-undef */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { history, SectionHeading, detailsPage, navFactory, ResourceSummary, resourcePathFromModel, ResourceLink } from './utils';
import { viewYamlComponent } from './utils/vertnav';
import { ClusterServiceClassModel } from '../models';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, K8sResourceKindReference, serviceClassDisplayName } from '../module/k8s';
import { ClusterServicePlanPage } from './cluster-service-plan';
import { ClusterServiceClassIcon } from './cluster-service-class-icon';
import { ClusterServiceClassInfo } from './cluster-service-class-info';

const ClusterServiceClassReference: K8sResourceKindReference = 'ClusterServiceClass';

const createInstance = (kindObj, serviceClass) => {
  if (!_.get(serviceClass, 'status.removedFromBrokerCatalog')) {
    return {
      btnClass: 'btn-primary',
      callback: () => {
        history.push(`/k8s/cluster/clusterserviceclasses/${serviceClass.metadata.name}/new`);
      },
      label: 'Create Instance',
    };
  }
};

const actionButtons = [
  createInstance
];

const ClusterServiceClassHeader: React.SFC<ClusterServiceClassHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-sm-6 col-xs-12" sortFunc="serviceClassDisplayName" currentSortFunc="serviceClassDisplayName">Display Name</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="spec.clusterServiceBrokerName">External Name</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="spec.clusterServiceBrokerName">Broker</ColHead>
</ListHeader>;

const ClusterServiceClassListRow: React.SFC<ClusterServiceClassRowProps> = ({obj: serviceClass}) => {
  const path = resourcePathFromModel(ClusterServiceClassModel, serviceClass.metadata.name);
  return <ResourceRow obj={serviceClass}>
    <div className="col-sm-6 col-xs-12 co-resource-link-wrapper">
      <ClusterServiceClassIcon serviceClass={serviceClass} />
      <Link to={path}>{serviceClassDisplayName(serviceClass)}</Link>
    </div>
    <div className="col-sm-3 hidden-xs">
      {serviceClass.spec.externalName}
    </div>
    <div className="col-sm-3 hidden-xs co-break-word">
      <ResourceLink kind="ClusterServiceBroker" name={serviceClass.spec.clusterServiceBrokerName} />
    </div>
  </ResourceRow>;
};

const ClusterServiceClassDetails: React.SFC<ClusterServiceClassDetailsProps> = ({obj: serviceClass}) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-md-7 col-md-push-5" style={{marginBottom: '20px'}}>
      <ClusterServiceClassInfo obj={serviceClass} />
    </div>
    <div className="col-md-5 col-md-pull-7">
      <SectionHeading text="Service Class Overview" />
      <ResourceSummary resource={serviceClass} showPodSelector={false} showNodeSelector={false}>
        <dt>External Name</dt>
        <dd>{serviceClass.spec.externalName || '-'}</dd>
      </ResourceSummary>
      {serviceClass.status.removedFromBrokerCatalog && <React.Fragment>
        <dt>Removed From Catalog</dt>
        <dd>{serviceClass.status.removedFromBrokerCatalog}</dd>
      </React.Fragment>}
    </div>
  </div>
</div>;

export const ClusterServiceClassDetailsPage: React.SFC<ClusterServiceClassDetailsPageProps> = props => <DetailsPage
  {...props}
  buttonActions={actionButtons}
  titleFunc={serviceClassDisplayName}
  kind={ClusterServiceClassReference}
  pages={[navFactory.details(detailsPage(ClusterServiceClassDetails)),
    navFactory.editYaml(viewYamlComponent),
    navFactory.clusterServicePlans(({obj}) => <ClusterServicePlanPage showTitle={false}
      fieldSelector={`spec.clusterServiceClassRef.name=${obj.metadata.name}`} />)]}
/>;

export const ClusterServiceClassList: React.SFC = props => <List {...props} Header={ClusterServiceClassHeader} Row={ClusterServiceClassListRow} defaultSortFunc="serviceClassDisplayName" />;

export const ClusterServiceClassPage: React.SFC<ClusterServiceClassPageProps> = props =>
  <ListPage
    ListComponent={ClusterServiceClassList}
    kind={ClusterServiceClassReference}
    filterLabel="Service Classes by display name"
    textFilter="service-class"
    canCreate={false}
    {...props}
  />;

export type ClusterServiceClassRowProps = {
  obj: K8sResourceKind
};

export type ClusterServiceClassHeaderProps = {
  obj: K8sResourceKind
};

export type ClusterServiceClassPageProps = {
  showTitle?: boolean,
  fieldSelector?: string
};

export type ClusterServiceClassDetailsProps = {
  obj: K8sResourceKind,
};

export type ClusterServiceClassDetailsPageProps = {
  match: any,
  name: string,
};
