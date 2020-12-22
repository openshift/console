import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, LabelList, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceIcon, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { FederatedPodModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(FederatedPodModel), ...Kebab.factory.common];

const kind = FederatedPodModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedPodTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortFunc: 'podPhase',
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
FederatedPodTableHeader.displayName = 'FederatedPodTableHeader';

const FederatedPodTableRow: RowFunction<K8sResourceKind> = ({ obj: pod, index, key, style }) => {
  return (
    <TableRow id={pod.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={pod.metadata.name} namespace={pod.metadata.namespace} title={pod.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={pod.status.phase} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <LabelList kind={kind} labels={pod.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {`${_.size(pod.metadata.annotations)} Annotation`}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={pod.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pod} />
      </TableData>
    </TableRow>
  );
};

export const ClusterRow: React.FC<ClusterRowProps> = ({ pod }) => {
  return (
    <div className="row">
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
        <ResourceIcon kind={kind} />
        {pod.metadata.name}
      </div>
      <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">
        <ResourceLink kind="Cluster" name={pod.spec.placement.clusters[0].name} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Status status={pod.status.phase} />
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        <Timestamp timestamp={pod.metadata.creationTimestamp} />
      </div>
    </div>
  );
};

export const PodDistributionTable: React.FC<PodDistributionTableProps> = ({
  heading,
  pod
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
          <ClusterRow key={i} pod={pod} container={c} />
        ))*/}
          <ClusterRow pod={pod} />
        </div>
      </div>
    </>
  );

const FederatedPodDetails: React.FC<FederatedPodDetailsProps> = ({ obj: pod }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Pod Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={pod} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <PodDistributionTable
        key="distributionTable"
        heading="Distribution"
        pod={pod} />
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const FederatedPods: React.FC = props => <Table {...props} aria-label="Federated Pods" Header={FederatedPodTableHeader} Row={FederatedPodTableRow} virtualize />;

export const FederatedPodsPage: React.FC<FederatedPodsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedPods} kind={kind} {...props} />;

export const FederatedPodsDetailsPage: React.FC<FederatedPodsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedPodDetails)), editYaml()]} />;

type ClusterRowProps = {
  pod: K8sResourceKind;
}

type PodDistributionTableProps = {
  pod: K8sResourceKind;
  heading: string;
};

type FederatedPodDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedPodsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedPodsDetailsPageProps = {
  match: any;
};
