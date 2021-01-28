import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ServiceClassModel } from '../../models';
import { ServicePlansPage } from './service-plan';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';

const kind = ServiceClassModel.kind;

const ServiceClassDetails: React.FC<ServiceClassDetailsProps> = ({ obj: serviceClass }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Service Broker Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceClass} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>BINDABLE</dt>
              <dd>{serviceClass.spec.bindable ? 'True' : 'False'}</dd>
              <dt> SERVICE BROKER</dt>
              <dd>{serviceClass.spec.serviceBrokerName}</dd>
              <dt>ID</dt>
              <dd>{serviceClass.spec.externalID}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServiceClassDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const ServiceClassesDetailsPage: React.FC<ServiceClassesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} pages={[details(ServiceClassDetails), editYaml(), { href: 'serviceplans', name: 'Service Plan', component: ServicePlansPage }]} />;
ServiceClassesDetailsPage.displayName = 'ServiceClassesDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', //NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), //BINDABLE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // SERVICEBROKER
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
];

const ServiceClassTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.spec.bindable ? 'True' : 'False'}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceLink kind="ServiceBroker" name={obj.spec.serviceBrokerName} namespace={obj.metadata.namespace} title={obj.spec.serviceBrokerName} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};

const ServiceClassTableHeader = () => {
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
      title: 'Service Broker',
      sortField: 'spec.serviceBrokerName',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
  ];
};

ServiceClassTableHeader.displayName = 'ServiceClassTableHeader';

const ServiceClassesList: React.FC = props => <Table {...props} aria-label="Service Class" Header={ServiceClassTableHeader} Row={ServiceClassTableRow} />;
ServiceClassesList.displayName = 'ServiceClassesList';

const ServiceClassesPage: React.FC<ServiceClassesPageProps> = props => {
  return <ListPage canCreate={true} kind={kind} ListComponent={ServiceClassesList} {...props} />;
};
ServiceClassesPage.displayName = 'ServiceClassesPage';

export { ServiceClassesList, ServiceClassesPage, ServiceClassesDetailsPage };
type ServiceClassesPageProps = {};

type ServiceClassesDetailsPageProps = {
  match: any;
};
