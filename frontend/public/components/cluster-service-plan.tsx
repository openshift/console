/* eslint-disable no-undef */

import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SectionHeading, detailsPage, navFactory, ResourceLink, ResourceSummary } from './utils';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, referenceForModel, servicePlanDisplayName } from '../module/k8s';
import { ClusterServicePlanModel, ClusterServiceBrokerModel, ClusterServiceClassModel } from '../models';
import { viewYamlComponent } from './utils/horizontal-nav';

const ClusterServicePlanHeader: React.SFC<ClusterServicePlanHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="spec.externalName">External Name</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="spec.clusterServiceBrokerName">Broker</ColHead>
</ListHeader>;

const ClusterServicePlanListRow: React.SFC<ClusterServicePlanRowProps> = ({obj: servicePlan}) => <ResourceRow obj={servicePlan}>
  <div className="col-sm-4 col-xs-6">
    <ResourceLink kind={referenceForModel(ClusterServicePlanModel)} name={servicePlan.metadata.name} displayName={servicePlan.spec.externalName} />
  </div>
  <div className="col-sm-4 col-xs-6">
    {servicePlan.spec.externalName}
  </div>
  <div className="col-sm-4 hidden-xs co-break-word">
    <ResourceLink kind={referenceForModel(ClusterServiceBrokerModel)} name={servicePlan.spec.clusterServiceBrokerName} title={servicePlan.spec.clusterServiceBrokerName} />
  </div>
</ResourceRow>;

const ClusterServicePlanDetails: React.SFC<ClusterServicePlanDetailsProps> = ({obj: servicePlan}) => {
  return <div className="co-m-pane__body">
    <SectionHeading text="Service Plan Overview" />
    <div className="row">
      <div className="col-md-6">
        <ResourceSummary resource={servicePlan} />
      </div>
      <div className="col-md-6">
        <dl className="co-m-pane__details">
          <dt>Description</dt>
          <dd>{servicePlan.spec.description}</dd>
          <dt>Broker</dt>
          <dd><ResourceLink kind={referenceForModel(ClusterServiceBrokerModel)} name={servicePlan.spec.clusterServiceBrokerName} /></dd>
          <dt>Service Class</dt>
          <dd><ResourceLink kind={referenceForModel(ClusterServiceClassModel)} name={servicePlan.spec.clusterServiceClassRef.name} /></dd>
          {servicePlan.status.removedFromBrokerCatalog && <React.Fragment>
            <dt>Removed From Catalog</dt>
            <dd>{servicePlan.status.removedFromBrokerCatalog}</dd>
          </React.Fragment>}
        </dl>
      </div>
    </div>
  </div>;
};

export const ClusterServicePlanDetailsPage: React.SFC<ClusterServicePlanDetailsPageProps> = props => <DetailsPage
  {...props}
  titleFunc={servicePlanDisplayName}
  kind={referenceForModel(ClusterServicePlanModel)}
  pages={[
    navFactory.details(detailsPage(ClusterServicePlanDetails)),
    navFactory.editYaml(viewYamlComponent),
  ]}
/>;
export const ClusterServicePlanList: React.SFC = props => <List {...props} Header={ClusterServicePlanHeader} Row={ClusterServicePlanListRow} />;

export const ClusterServicePlanPage: React.SFC<ClusterServicePlanPageProps> = props =>
  <ListPage
    {...props}
    ListComponent={ClusterServicePlanList}
    kind={referenceForModel(ClusterServicePlanModel)}
    canCreate={false}
  />;

export type ClusterServicePlanRowProps = {
  obj: K8sResourceKind
};

export type ClusterServicePlanHeaderProps = {
  obj: K8sResourceKind
};

export type ClusterServicePlanPageProps = {
  showTitle?: boolean,
  fieldSelector?: string
};

export type ClusterServicePlanDetailsProps = {
  obj: K8sResourceKind
};

export type ClusterServicePlanDetailsPageProps = {
  match: any
};
