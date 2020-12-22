import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedNamespaceModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedNamespaceModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedNamespaceModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedNamespaceTableHeader = () => {
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
      sortFunc: 'namespaceNumScheduled',
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
FederatedNamespaceTableHeader.displayName = 'FederatedNamespaceTableHeader';

const FederatedNamespaceTableRow: RowFunction<K8sResourceKind> = ({ obj: namespace, index, key, style }) => {
  return (
    <TableRow id={namespace.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={namespace.metadata.name} namespace={namespace.metadata.namespace} title={namespace.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={namespace.metadata.namespace} title={namespace.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${namespace.metadata.namespace}/namespaces/${namespace.metadata.name}/pods`} title="pods">
          {namespace.status?.currentNumberScheduled} of {namespace.status?.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={namespace.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={namespace.spec.selector} namespace={namespace.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={namespace} />
      </TableData>
    </TableRow>
  );
};

export const FederatedNamespaceDetailsList: React.FC<FederatedNamespaceDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const FederatedNamespaceDetails: React.FC<FederatedNamespaceDetailsProps> = ({ obj: namespace }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Namespace Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={namespace} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedNamespaceDetailsList ds={namespace} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedNamespaces: React.FC = props => <Table {...props} aria-label="Federated Namespaces" Header={FederatedNamespaceTableHeader} Row={FederatedNamespaceTableRow} virtualize />;

export const FederatedNamespacesPage: React.FC<FederatedNamespacesPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedNamespaces} kind={kind} {...props} />;

export const FederatedNamespacesDetailsPage: React.FC<FederatedNamespacesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedNamespaceDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedNamespaceDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedNamespaceDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedNamespacesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedNamespacesDetailsPageProps = {
  match: any;
};
