import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, LabelList, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceIcon, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { FederatedHPAModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(FederatedHPAModel), ...Kebab.factory.common];

const kind = FederatedHPAModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedHPATableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortFunc: 'horizontalpodautoscalerPhase',
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
FederatedHPATableHeader.displayName = 'FederatedHPATableHeader';

const FederatedHPATableRow: RowFunction<K8sResourceKind> = ({ obj: horizontalpodautoscaler, index, key, style }) => {
  return (
    <TableRow id={horizontalpodautoscaler.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={horizontalpodautoscaler.metadata.name} namespace={horizontalpodautoscaler.metadata.namespace} title={horizontalpodautoscaler.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={horizontalpodautoscaler.status.phase} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <LabelList kind={kind} labels={horizontalpodautoscaler.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {`${_.size(horizontalpodautoscaler.metadata.annotations)} Annotation`}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={horizontalpodautoscaler.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={horizontalpodautoscaler} />
      </TableData>
    </TableRow>
  );
};

export const ClusterRow: React.FC<ClusterRowProps> = ({ horizontalpodautoscaler }) => {
  return (
    <div className="row">
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
        <ResourceIcon kind={kind} />
        {horizontalpodautoscaler.metadata.name}
      </div>
      <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">
        <ResourceLink kind="Cluster" name={horizontalpodautoscaler.spec.placement.clusters[0].name} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Status status={horizontalpodautoscaler.status.phase} />
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        <Timestamp timestamp={horizontalpodautoscaler.metadata.creationTimestamp} />
      </div>
    </div>
  );
};

export const HPADistributionTable: React.FC<HPADistributionTableProps> = ({
  heading,
  horizontalpodautoscaler
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
          <ClusterRow key={i} horizontalpodautoscaler={horizontalpodautoscaler} container={c} />
        ))*/}
          <ClusterRow horizontalpodautoscaler={horizontalpodautoscaler} />
        </div>
      </div>
    </>
  );

const FederatedHPADetails: React.FC<FederatedHPADetailsProps> = ({ obj: horizontalpodautoscaler }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated HPA Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={horizontalpodautoscaler} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <HPADistributionTable
        key="distributionTable"
        heading="Distribution"
        horizontalpodautoscaler={horizontalpodautoscaler} />
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const FederatedHPAs: React.FC = props => <Table {...props} aria-label="Federated HPAs" Header={FederatedHPATableHeader} Row={FederatedHPATableRow} virtualize />;

export const FederatedHPAsPage: React.FC<FederatedHPAsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedHPAs} kind={kind} {...props} />;

export const FederatedHPAsDetailsPage: React.FC<FederatedHPAsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedHPADetails)), editYaml()]} />;

type ClusterRowProps = {
  horizontalpodautoscaler: K8sResourceKind;
}

type HPADistributionTableProps = {
  horizontalpodautoscaler: K8sResourceKind;
  heading: string;
};

type FederatedHPADetailsProps = {
  obj: K8sResourceKind;
};

type FederatedHPAsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedHPAsDetailsPageProps = {
  match: any;
};
