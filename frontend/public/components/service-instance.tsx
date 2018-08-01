import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, SectionHeading, navFactory, ResourceCog, ResourceLink, ResourceSummary, StatusWithIcon, Timestamp } from './utils';
import { ResourceEventStream } from './events';
import { Conditions } from './conditions';
import { ServiceCatalogParameters, ServiceCatalogParametersSecrets } from './service-catalog-parameters';

const ServiceInstancesReference: K8sResourceKindReference = 'ServiceInstance';

const { common } = Cog.factory;

const menuActions = [
  ...common,
];

const ServiceInstanceDetails: React.SFC<ServiceInstanceDetailsProps> = ({obj: si}) => {
  const siPlan = si.spec.clusterServicePlanExternalName || si.spec.servicePlanExternalName;
  const siParameters = _.get(si, 'status.externalProperties.parameters', {});

  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Service Instance Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={si} showPodSelector={false} showNodeSelector={false} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>External Name</dt>
            {/* TODO:  add link */}
            <dd>{si.spec.clusterServiceClassExternalName || si.spec.serviceClassExternalName}</dd>
            <dt>Status</dt>
            <dd><StatusWithIcon obj={si} /></dd>
            <dt>Plan</dt>
            <dd>{siPlan || '-'}</dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={si.status.conditions} />
    </div>
    {!_.isEmpty(si.spec.parametersFrom) && <ServiceCatalogParametersSecrets obj={si} /> }
    {!_.isEmpty(siParameters) && <ServiceCatalogParameters parameters={siParameters} /> }
  </React.Fragment>;
};

const pages = [navFactory.details(ServiceInstanceDetails), navFactory.editYaml(), navFactory.events(ResourceEventStream)];
export const ServiceInstanceDetailsPage: React.SFC<ServiceInstanceDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={ServiceInstancesReference}
    menuActions={menuActions}
    pages={pages} />;
ServiceInstanceDetailsPage.displayName = 'ServiceInstanceDetailsPage';

const ServiceInstancesHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 hidden-xs">Status</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="spec.clusterServicePlanExternalName || spec.servicePlanExternalName">Plan</ColHead>
</ListHeader>;

const ServiceInstancesRow: React.SFC<ServiceInstancesRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={ServiceInstancesReference} resource={obj} />
    <ResourceLink kind={ServiceInstancesReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
  </div>
  <div className="col-md-2 col-sm-4 hidden-xs co-break-word">
    <StatusWithIcon obj={obj} />
  </div>
  <div className="col-md-2 hidden-sm hidden-xs co-break-word">
    <Timestamp timestamp={obj.metadata.creationTimestamp} />
  </div>
  <div className="col-md-2 hidden-sm hidden-xs co-break-word">
    {obj.spec.clusterServicePlanExternalName || obj.spec.servicePlanExternalName}
  </div>
</div>;

const ServiceInstancesList: React.SFC = props => <List {...props} Header={ServiceInstancesHeader} Row={ServiceInstancesRow} />;
ServiceInstancesList.displayName = 'ServiceInstancesList';

export const ServiceInstancesPage: React.SFC<ServiceInstancesPageProps> = props =>
  <ListPage
    {...props}
    kind={ServiceInstancesReference}
    ListComponent={ServiceInstancesList}
    filterLabel="Service Instances by name"
  />;
ServiceInstancesPage.displayName = 'ServiceInstancesListPage';

/* eslint-disable no-undef */
export type ServiceInstanceStatusProps = {
  obj: K8sResourceKind
};

export type ServiceInstancesRowProps = {
  obj: any,
};

export type ServiceInstanceDetailsProps = {
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
/* eslint-enable no-undef */
