/* eslint-disable no-undef */

import * as React from 'react';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Kebab, SectionHeading, detailsPage, navFactory, ResourceLink, ResourceKebab, ResourceSummary, StatusWithIcon, Timestamp } from './utils';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, referenceForModel } from '../module/k8s';
import { ClusterServiceBrokerModel } from '../models';
import { Conditions } from './conditions';
import { ClusterServiceClassPage } from './cluster-service-class';

const menuActions = Kebab.factory.common;

const ClusterServiceBrokerHeader: React.SFC<ClusterServiceBrokerHeaderProps> = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortFunc="serviceCatalogStatus">Status</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="spec.relistBehavior">Relist Behavior</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="status.lastCatalogRetrievalTime">Last Retrieved</ColHead>
</ListHeader>;

const ClusterServiceBrokerListRow: React.SFC<ClusterServiceBrokerRowProps> = ({obj: serviceBroker}) => <ResourceRow obj={serviceBroker}>
  <div className="col-sm-3 col-xs-6">
    <ResourceLink kind={referenceForModel(ClusterServiceBrokerModel)} name={serviceBroker.metadata.name} />
  </div>
  <div className="col-sm-3 col-xs-6 co-break-word">
    <StatusWithIcon obj={serviceBroker} />
  </div>
  <div className="col-sm-3 hidden-xs">
    {serviceBroker.spec.relistBehavior}
  </div>
  <div className="col-sm-3 hidden-xs">
    <Timestamp timestamp={serviceBroker.status.lastCatalogRetrievalTime} />
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={referenceForModel(ClusterServiceBrokerModel)} resource={serviceBroker} />
  </div>
</ResourceRow>;

const ClusterServiceBrokerDetails: React.SFC<ClusterServiceBrokerDetailsProps> = ({obj: serviceBroker}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Service Broker Overview" />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={serviceBroker} showPodSelector={false} showNodeSelector={false} />
          <dt>Last Catalog Retrieval Time</dt>
          <dd><Timestamp timestamp={serviceBroker.status.lastCatalogRetrievalTime} /></dd>
          {serviceBroker.spec.insecureSkipTLSVerify && <dt>Insecure Skip TLS Verify</dt>}
          {serviceBroker.spec.insecureSkipTLSVerify && <dd>{serviceBroker.spec.insecureSkipTLSVerify}</dd>}
        </div>
        <div className="col-md-6">
          <dl className="co-m-pane__details">
            <dt>Status</dt>
            <dd><StatusWithIcon obj={serviceBroker} /></dd>
            <dt>Broker URL</dt>
            <dd>
              <a href={serviceBroker.spec.url} target="_blank" rel="noopener noreferrer">{serviceBroker.spec.url}</a>
            </dd>
            <dt>Relist Behavior</dt>
            <dd>{serviceBroker.spec.relistBehavior}</dd>
            {serviceBroker.spec.relistBehavior === 'Duration' && <React.Fragment>
              <dt>Relist Duration</dt>
              <dd>{serviceBroker.spec.relistDuration || '-'}</dd>
            </React.Fragment>}
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={serviceBroker.status.conditions} />
    </div>
  </React.Fragment>;
};

const ServiceClassTabPage = ({obj}) => <ClusterServiceClassPage showTitle={false} fieldSelector={`spec.clusterServiceBrokerName=${obj.metadata.name}`} />;
export const ClusterServiceBrokerDetailsPage: React.SFC<ClusterServiceBrokerDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={referenceForModel(ClusterServiceBrokerModel)}
  menuActions={menuActions}
  pages={[
    navFactory.details(detailsPage(ClusterServiceBrokerDetails)),
    navFactory.editYaml(),
    navFactory.clusterServiceClasses(ServiceClassTabPage),
  ]}
/>;
export const ClusterServiceBrokerList: React.SFC = props => <List {...props} Header={ClusterServiceBrokerHeader} Row={ClusterServiceBrokerListRow} />;

export const ClusterServiceBrokerPage: React.SFC<ClusterServiceBrokerPageProps> = props =>
  <ListPage
    {...props}
    ListComponent={ClusterServiceBrokerList}
    kind={referenceForModel(ClusterServiceBrokerModel)}
    canCreate={true}
    showTitle={false}
  />;

export type ClusterServiceBrokerRowProps = {
  obj: K8sResourceKind
};

export type ClusterServiceBrokerHeaderProps = {
  obj: K8sResourceKind
};

export type ClusterServiceBrokerPageProps = {
  obj: K8sResourceKind
};

export type ClusterServiceBrokerDetailsProps = {
  obj: K8sResourceKind
};

export type ClusterServiceBrokerDetailsPageProps = {
  match: any
};
