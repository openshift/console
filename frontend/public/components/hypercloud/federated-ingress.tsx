import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedIngressModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedIngressModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedIngressModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedIngressTableHeader = () => {
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
      sortFunc: 'ingressNumScheduled',
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
FederatedIngressTableHeader.displayName = 'FederatedIngressTableHeader';

const FederatedIngressTableRow: RowFunction<K8sResourceKind> = ({ obj: ingress, index, key, style }) => {
  return (
    <TableRow id={ingress.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={ingress.metadata.name} namespace={ingress.metadata.namespace} title={ingress.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={ingress.metadata.namespace} title={ingress.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${ingress.metadata.namespace}/ingresss/${ingress.metadata.name}/pods`} title="pods">
          {ingress.status.currentNumberScheduled} of {ingress.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={ingress.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={ingress.spec.selector} namespace={ingress.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={ingress} />
      </TableData>
    </TableRow>
  );
};

export const FederatedIngressDetailsList: React.FC<FederatedIngressDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const FederatedIngressDetails: React.FC<FederatedIngressDetailsProps> = ({ obj: ingress }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Ingress Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={ingress} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedIngressDetailsList ds={ingress} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedIngresses: React.FC = props => <Table {...props} aria-label="Federated Ingresses" Header={FederatedIngressTableHeader} Row={FederatedIngressTableRow} virtualize />;

export const FederatedIngressesPage: React.FC<FederatedIngressesPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedIngresses} kind={kind} {...props} />;

export const FederatedIngressesDetailsPage: React.FC<FederatedIngressesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedIngressDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedIngressDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedIngressDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedIngressesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedIngressesDetailsPageProps = {
  match: any;
};
