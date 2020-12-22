import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedConfigMapModel } from '../../models';

export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedConfigMapModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedConfigMapModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedConfigMapTableHeader = () => {
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
      sortFunc: 'configmapNumScheduled',
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
FederatedConfigMapTableHeader.displayName = 'FederatedConfigMapTableHeader';

const FederatedConfigMapTableRow: RowFunction<K8sResourceKind> = ({ obj: configmap, index, key, style }) => {
  return (
    <TableRow id={configmap.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={configmap.metadata.name} namespace={configmap.metadata.namespace} title={configmap.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={configmap.metadata.namespace} title={configmap.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link to={`/k8s/ns/${configmap.metadata.namespace}/configmaps/${configmap.metadata.name}/pods`} title="pods">
          {configmap.status.currentNumberScheduled} of {configmap.status.desiredNumberScheduled} pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={configmap.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={configmap.spec.selector} namespace={configmap.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={configmap} />
      </TableData>
    </TableRow>
  );
};

export const FederatedConfigMapDetailsList: React.FC<FederatedConfigMapDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const FederatedConfigMapDetails: React.FC<FederatedConfigMapDetailsProps> = ({ obj: configmap }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Config Map Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={configmap} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <FederatedConfigMapDetailsList ds={configmap} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedConfigMaps: React.FC = props => <Table {...props} aria-label="Federated Config Maps" Header={FederatedConfigMapTableHeader} Row={FederatedConfigMapTableRow} virtualize />;

export const FederatedConfigMapsPage: React.FC<FederatedConfigMapsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedConfigMaps} kind={kind} {...props} />;

export const FederatedConfigMapsDetailsPage: React.FC<FederatedConfigMapsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedConfigMapDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedConfigMapDetailsListProps = {
  ds: K8sResourceKind;
};

type FederatedConfigMapDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedConfigMapsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedConfigMapsDetailsPageProps = {
  match: any;
};
