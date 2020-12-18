import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedServiceModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedServiceModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedServiceModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedServiceTableHeader = () => {
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
      title: 'Status',
      sortFunc: 'serviceNumScheduled',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Pod Selector',
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
FederatedServiceTableHeader.displayName = 'FederatedServiceTableHeader';

const FederatedServiceTableRow: RowFunction<K8sResourceKind> = ({ obj: service, index, key, style }) => {
  return (
    <TableRow id={service.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={service.metadata.name} namespace={service.metadata.namespace} title={service.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={service.metadata.namespace} title={service.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${service.metadata.namespace}/services/${service.metadata.name}/pods`} title="pods">
          {service.status.currentNumberScheduled} of {service.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={service.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={service.spec.selector} namespace={service.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={service} />
      </TableData>
    </TableRow>
  );
};

export const FederatedServiceDetailsList: React.FC<FederatedServiceDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const FederatedServiceDetails: React.FC<FederatedServiceDetailsProps> = ({ obj: service }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Service Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={service} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedServiceDetailsList ds={service} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedServices: React.FC = props => <Table {...props} aria-label="Federated Services" Header={FederatedServiceTableHeader} Row={FederatedServiceTableRow} virtualize />;

export const FederatedServicesPage: React.FC<FederatedServicesPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedServices} kind={kind} {...props} />;

export const FederatedServicesDetailsPage: React.FC<FederatedServicesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedServiceDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedServiceDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedServiceDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedServicesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedServicesDetailsPageProps = {
  match: any;
};
