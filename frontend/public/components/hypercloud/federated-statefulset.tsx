import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, LabelList, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceIcon, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { FederatedStatefulSetModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(FederatedStatefulSetModel), ...Kebab.factory.common];

const kind = FederatedStatefulSetModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedStatefulSetTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortFunc: 'statefulsetPhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Annotations',
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
FederatedStatefulSetTableHeader.displayName = 'FederatedStatefulSetTableHeader';

const FederatedStatefulSetTableRow: RowFunction<K8sResourceKind> = ({ obj: statefulset, index, key, style }) => {
  return (
    <TableRow id={statefulset.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={statefulset.metadata.name} namespace={statefulset.metadata.namespace} title={statefulset.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={statefulset.status.phase} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <LabelList kind={kind} labels={statefulset.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {`${_.size(statefulset.metadata.annotations)} Annotation`}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={statefulset.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={statefulset} />
      </TableData>
    </TableRow>
  );
};

export const ClusterRow: React.FC<ClusterRowProps> = ({ statefulset }) => {
  return (
    <div className="row">
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
        <ResourceIcon kind={kind} />
        {statefulset.metadata.name}
      </div>
      <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">
        <ResourceLink kind="Cluster" name={statefulset.spec.placement.clusters[0].name} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Status status={statefulset.status.phase} />
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        <Timestamp timestamp={statefulset.metadata.creationTimestamp} />
      </div>
    </div>
  );
};

export const StatefulSetDistributionTable: React.FC<StatefulSetDistributionTableProps> = ({
  heading,
  statefulset
}) => (
    <>
      <SectionHeading text={heading} />
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Resource Name</div>
          <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">Cluster Name</div>
          <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">Result</div>
          <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">Time</div>
        </div>
        <div className="co-m-table-grid__body">
          {/*containers.map((c: any, i: number) => (
          <ClusterRow key={i} statefulset={statefulset} container={c} />
        ))*/}
          <ClusterRow statefulset={statefulset} />
        </div>
      </div>
    </>
  );

const FederatedStatefulSetDetails: React.FC<FederatedStatefulSetDetailsProps> = ({ obj: statefulset }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Stateful Set Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={statefulset} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <StatefulSetDistributionTable
        key="distributionTable"
        heading="Distribution"
        statefulset={statefulset} />
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const FederatedStatefulSets: React.FC = props => <Table {...props} aria-label="Federated Stateful Sets" Header={FederatedStatefulSetTableHeader} Row={FederatedStatefulSetTableRow} virtualize />;

export const FederatedStatefulSetsPage: React.FC<FederatedStatefulSetsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedStatefulSets} kind={kind} {...props} />;

export const FederatedStatefulSetsDetailsPage: React.FC<FederatedStatefulSetsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedStatefulSetDetails)), editYaml()]} />;

type ClusterRowProps = {
  statefulset: K8sResourceKind;
}

type StatefulSetDistributionTableProps = {
  statefulset: K8sResourceKind;
  heading: string;
};

type FederatedStatefulSetDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedStatefulSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedStatefulSetsDetailsPageProps = {
  match: any;
};
