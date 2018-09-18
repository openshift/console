import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference, serviceCatalogStatus } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, SectionHeading, navFactory, ResourceCog, ResourceLink, ResourceSummary, StatusWithIcon } from './utils';
import { ResourceEventStream } from './events';
import { Conditions } from './conditions';
import { ServiceCatalogParameters, ServiceCatalogParametersSecrets } from './service-catalog-parameters';

const ServiceBindingsReference: K8sResourceKindReference = 'ServiceBinding';

const { common } = Cog.factory;

const menuActions = [
  ...common,
];

const secretLink = (obj) => serviceCatalogStatus(obj) === 'Ready'
  ? <ResourceLink kind="Secret" name={obj.spec.secretName} title={obj.spec.secretName} namespace={obj.metadata.namespace} />
  : '-';

const ServiceBindingDetails: React.SFC<ServiceBindingDetailsProps> = ({obj: sb}) => {
  const sbParameters = _.get(sb, 'status.externalProperties.parameters', {});

  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Service Binding Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={sb} showPodSelector={false} showNodeSelector={false} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Service Instance</dt>
            <dd><ResourceLink kind="ServiceInstance" name={sb.spec.instanceRef.name} namespace={sb.metadata.namespace} /></dd>
            <dt>Secret</dt>
            <dd>{ secretLink(sb) }</dd>
            <dt>Status</dt>
            <dd><StatusWithIcon obj={sb} /></dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={sb.status.conditions} />
    </div>
    {!_.isEmpty(sb.spec.parametersFrom) && <ServiceCatalogParametersSecrets obj={sb} /> }
    {!_.isEmpty(sbParameters) && <ServiceCatalogParameters parameters={sbParameters} /> }
  </React.Fragment>;
};

const pages = [navFactory.details(ServiceBindingDetails), navFactory.editYaml(), navFactory.events(ResourceEventStream)];
export const ServiceBindingDetailsPage: React.SFC<ServiceBindingDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={ServiceBindingsReference}
    menuActions={menuActions}
    pages={pages} />;
ServiceBindingDetailsPage.displayName = 'ServiceBindingDetailsPage';

const ServiceBindingsHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 hidden-xs" sortField="spec.instanceRef.name">Service Instance</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="spec.secretName">Secret</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="serviceCatalogStatus">Status</ColHead>
</ListHeader>;

const ServiceBindingsRow: React.SFC<ServiceBindingsRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={ServiceBindingsReference} resource={obj} />
    <ResourceLink kind={ServiceBindingsReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-md-2 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
  </div>
  <div className="col-md-2 col-sm-4 hidden-xs co-break-word">
    <ResourceLink kind="ServiceInstance" name={obj.spec.instanceRef.name} title={obj.spec.instanceRef.name} namespace={obj.metadata.namespace} />
  </div>
  <div className="col-md-3 hidden-sm hidden-xs co-break-word">
    { secretLink(obj) }
  </div>
  <div className="col-md-2 hidden-sm hidden-xs co-break-word">
    <StatusWithIcon obj={obj} />
  </div>
</div>;

const ServiceBindingsList: React.SFC = props => <List {...props} Header={ServiceBindingsHeader} Row={ServiceBindingsRow} />;
ServiceBindingsList.displayName = 'ServiceBindingsList';

export const ServiceBindingsPage: React.SFC<ServiceBindingsPageProps> = props =>
  <ListPage
    {...props}
    kind={ServiceBindingsReference}
    ListComponent={ServiceBindingsList}
    filterLabel="Service Bindings by name"
  />;
ServiceBindingsPage.displayName = 'ServiceBindingsListPage';

/* eslint-disable no-undef */
export type ServiceBindingsRowProps = {
  obj: any,
};

export type ServiceBindingDetailsProps = {
  obj: any,
};

export type ServiceBindingsPageProps = {
  autoFocus?: boolean,
  canCreate?: boolean,
  createHandler?: any,
  filters?: any,
  namespace?: string,
  selector?: any,
  showTitle?: boolean,
};

export type ServiceBindingDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */
