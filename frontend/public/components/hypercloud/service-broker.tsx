import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { ServiceBrokerModel } from '../../models';
import { ServiceBrokerKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { DetailsItem, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const serviceBrokerReference: K8sResourceKindReference = 'ServiceBroker';
const { common } = Kebab.factory;

export const serviceBrokerMenuActions = [...Kebab.getExtensionsActionsForKind(ServiceBrokerModel), ...common];

const ServiceBrokerDetails: React.FC<ServiceBrokerDetailsProps> = ({ obj: serviceBroker }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Service Broker Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceBroker} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <DetailsItem label="Status" obj={serviceBroker} path="status.phase">
                <Status status={ServiceBrokerPhase(serviceBroker)} />
              </DetailsItem>
              <dt>URL</dt>
              <dd>{serviceBroker.spec.url}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServiceBrokerDetailsProps = {
  obj: ServiceBrokerKind;
};

const { details, editYaml } = navFactory;
const ServiceBrokersDetailsPage: React.FC<ServiceBrokersDetailsPageProps> = props => <DetailsPage {...props} kind={serviceBrokerReference} menuActions={serviceBrokerMenuActions} pages={[details(ServiceBrokerDetails), editYaml()]} />;
ServiceBrokersDetailsPage.displayName = 'ServiceBrokersDetailsPage';

const kind = 'ServiceBroker';
const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-xl'), Kebab.columnClass];

const ServiceBrokerPhase = instance => {
  let phase = '';
  if (instance.status) {
    instance.status.conditions.forEach(cur => {
      if (cur.type === 'Ready') {
        if (cur.status === 'True') {
          phase = 'Running';
        } else {
          phase = 'Error';
        }
      }
    });
    return phase;
  }
};

const ServiceBrokerTableRow = ({ obj, index, key, style }) => {
  let phase = ServiceBrokerPhase(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={serviceBrokerReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.spec.url}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={serviceBrokerMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ServiceBrokerTableHeader = () => {
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
      title: 'Url',
      sortField: 'spec.url',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status',
      sortFunc: 'ServiceBrokerPhase',
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

ServiceBrokerTableHeader.displayName = 'ServiceBrokerTableHeader';

const ServiceBrokersList: React.FC = props => <Table {...props} aria-label="Service Broker" Header={ServiceBrokerTableHeader} Row={ServiceBrokerTableRow} virtualize />;
ServiceBrokersList.displayName = 'ServiceBrokersList';

const ServiceBrokersPage: React.FC<ServiceBrokersPageProps> = props => {
  return <ListPage canCreate={true} kind={serviceBrokerReference} ListComponent={ServiceBrokersList} {...props} />;
};
ServiceBrokersPage.displayName = 'ServiceBrokersPage';

export { ServiceBrokersList, ServiceBrokersPage, ServiceBrokersDetailsPage };

type ServiceBrokersPageProps = {};

type ServiceBrokersDetailsPageProps = {
  match: any;
};
