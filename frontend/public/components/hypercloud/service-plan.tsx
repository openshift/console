import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ServicePlanModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';

const kind = ServicePlanModel.kind;

const ServicePlanDetails: React.FC<ServicePlanDetailsProps> = ({ obj: servicePlan }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Service Plan Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={servicePlan} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>BINDABLE</dt>
              <dd>{servicePlan.spec.bindable ? 'True' : 'False'}</dd>
              <dt>EXTERNAL NAME</dt>
              <dd>{servicePlan.spec.externalName}</dd>
              <dt> SERVICE BROKER</dt>
              <dd>{servicePlan.spec.serviceBrokerName}</dd>
              <dt> SERVICE CLASS</dt>
              <dd>{servicePlan.spec.serviceClassRef.name}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServicePlanDetailsProps = {
  obj: K8sResourceKind;
};

const { details } = navFactory;
const ServicePlansDetailsPage: React.FC<ServicePlansDetailsPageProps> = props => <DetailsPage {...props} kind={kind} pages={[details(ServicePlanDetails)]} />;
ServicePlansDetailsPage.displayName = 'ServicePlansDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // BINDABLE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // EXTERNAL NAME
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // SERVICE BROKER
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // SERVICE CLASS
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
];

const ServicePlanTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.spec.bindable ? 'True' : 'False'}</TableData>
      <TableData className={tableColumnClasses[3]}>{obj.spec.externalName}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceLink kind="ServiceBroker" name={obj.spec.serviceBrokerName} namespace={obj.metadata.namespace} title={obj.spec.serviceBrokerName} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceLink kind="ServiceClass" name={obj.spec.serviceClassRef.name} namespace={obj.metadata.namespace} title={obj.spec.serviceClassRef.name} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};

const ServicePlanTableHeader = () => {
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
      title: 'Bindable',
      sortField: 'spec.bindable',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'External Name',
      sortField: 'spec.externalName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Service Broker',
      sortField: 'spec.serviceBrokerName',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Service Class',
      sortField: 'spec.serviceClassRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
  ];
};
ServicePlanTableHeader.displayName = 'ServicePlanTableHeader';

const ServicePlansList: React.FC = props => <Table {...props} aria-label="Service Plan" Header={ServicePlanTableHeader} Row={ServicePlanTableRow} />;
ServicePlansList.displayName = 'ServicePlansList';

const ServicePlansPage: React.FC<ServicePlansPageProps> = props => {
  return <ListPage canCreate={true} kind={kind} ListComponent={ServicePlansList} {...props} />;
};
ServicePlansPage.displayName = 'ServicePlansPage';

export { ServicePlansList, ServicePlansPage, ServicePlansDetailsPage };

type ServicePlansPageProps = {};

type ServicePlansDetailsPageProps = {
  match: any;
};
