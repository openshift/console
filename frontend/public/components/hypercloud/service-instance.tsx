import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ServiceInstanceModel } from '../../models';
import { ServiceInstanceKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { Kebab, ResourceKebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';

const serviceInstanceReference: K8sResourceKindReference = 'ServiceInstance';
const { common } = Kebab.factory;

export const serviceInstanceMenuActions = [...Kebab.getExtensionsActionsForKind(ServiceInstanceModel), ...common];

const ServiceInstanceDetails: React.FC<ServiceInstanceDetailsProps> = ({ obj: serviceInstance }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Service Instance Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceInstance} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt> SERVICE CLASS</dt>
              <dd>{serviceInstance.spec.serviceClassName}</dd>
              <dt> SERVICE PLAN</dt>
              <dd>{serviceInstance.spec.servicePlanName}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServiceInstanceDetailsProps = {
  obj: ServiceInstanceKind;
};

const { details, editYaml } = navFactory;
const ServiceInstancesDetailsPage: React.FC<ServiceInstancesDetailsPageProps> = props => <DetailsPage {...props} kind={serviceInstanceReference} menuActions={serviceInstanceMenuActions} pages={[details(ServiceInstanceDetails), editYaml()]} />;
ServiceInstancesDetailsPage.displayName = 'ServiceInstancesDetailsPage';

const kind = 'ServiceInstance';
const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // SERVICE CLASS
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // SERVICE PLAN
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const ServiceInstanceTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={serviceInstanceReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {obj.spec.clusterServiceClassName} {obj.spec.serviceClassName}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {obj.spec.clusterServicePlanName} {obj.spec.servicePlanName}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={serviceInstanceMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ServiceInstanceTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Service Class',
      sortField: 'spec.serviceClassName',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Service Plan',
      sortField: 'spec.servicePlanName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

ServiceInstanceTableHeader.displayName = 'ServiceInstanceTableHeader';

const ServiceInstancesList: React.FC = props => <Table {...props} aria-label="Service Instance" Header={ServiceInstanceTableHeader} Row={ServiceInstanceTableRow} />;
ServiceInstancesList.displayName = 'ServiceInstancesList';

const ServiceInstancesPage: React.FC<ServiceInstancesPageProps> = props => {
  return <ListPage canCreate={true} kind={serviceInstanceReference} ListComponent={ServiceInstancesList} {...props} />;
};
ServiceInstancesPage.displayName = 'ServiceInstancesPage';

export { ServiceInstancesList, ServiceInstancesPage, ServiceInstancesDetailsPage };

type ServiceInstancesPageProps = {};

type ServiceInstancesDetailsPageProps = {
  match: any;
};
