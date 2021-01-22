import * as React from 'react';
// import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { Status } from '@console/shared';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import {
  // AsyncComponent,
  DetailsItem,
  Kebab,
  KebabAction,
  detailsPage,
  // LabelList,
  navFactory,
  // NodesComponent,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  // Selector,
  Timestamp,
} from '../utils';
// import { ResourceEventStream } from '../events';
import { ClusterManagerModel } from '../../models';
// import { SpecCapability } from '@console/operator-lifecycle-manager/src/components/descriptors/types';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ClusterManagerModel), ...Kebab.factory.common];

const kind = ClusterManagerModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ClusterTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Provider',
      sortField: 'spec.provider',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Type',
      sortField: 'spec.provider',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status',
      sortField: 'status.ready',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Version',
      sortField: 'spec.version',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Node',
      sortField: 'spec.masterNum',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Owner',
      sortField: 'status.owner',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[8] },
    },
  ];
};
ClusterTableHeader.displayName = 'ClusterTableHeader';

const ClusterTableRow: RowFunction<IClusterTableRow> = ({ obj: cluster, index, key, style }) => {
  return (
    <TableRow id={cluster.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={cluster.metadata.name} displayName={cluster.fakeMetadata.fakename} title={cluster.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>{cluster.spec.provider}</TableData>
      <TableData className={classNames(tableColumnClasses[2])}>{cluster.spec.provider ? 'Create' : 'Enroll'}</TableData>
      <TableData className={tableColumnClasses[3]}>{cluster.status?.ready ? 'Ready' : 'Not Ready'}</TableData>
      <TableData className={tableColumnClasses[4]}>{cluster.spec.version}</TableData>
      <TableData className={tableColumnClasses[5]}>
        {ClusterNodesInfo(cluster)}
        {/* {`M: ${cluster.status?.masterRun} / ${cluster.spec?.masterNum}, W: ${cluster.status?.workerRun} / ${cluster.spec?.workerNum}`} */}
      </TableData>
      <TableData className={tableColumnClasses[6]}>{cluster.status.owner}</TableData>
      <TableData className={tableColumnClasses[7]}>
        <Timestamp timestamp={cluster.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={cluster} />
      </TableData>
    </TableRow>
  );
};

const ClusterNodesInfo = cluster => {
  return `M: ${cluster.status.masterRun ?? 0} / ${cluster.spec?.masterNum}, W: ${cluster.status.workerRun ?? 0} / ${cluster.spec?.workerNum}`;
};

// const ClusterNodes: React.FC<ClusterNodesProps> = props => <NodesComponent {...props} customData={{ showNodes: true }} />;

export const ClusterDetailsList: React.FC<ClusterDetailsListProps> = ({ cl }) => {
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label="Type" obj={cl} path="spec.provider">
        {cl.spec.provider ? 'Create' : 'Enroll'}
      </DetailsItem>
      <DetailsItem label="Status" obj={cl} path="status.ready">
        <Status status={cl.status.ready ? 'Ready' : 'Not Ready'} />
      </DetailsItem>
      <DetailsItem label="Provider" obj={cl} path="spec.provider" />
      <DetailsItem label="Version" obj={cl} path="spec.version" />
      <DetailsItem label="Region" obj={cl} path="spec.region" />
      <DetailsItem label="Master Node" obj={cl} path="spec.masterNum">
        {`${cl.status?.masterRun} / ${cl.spec.masterNum}`}
      </DetailsItem>
      <DetailsItem label="Master Node Type" obj={cl} path="spec.masterType" />
      <DetailsItem label="Worker Node" obj={cl} path="spec.workerNum">
        {`${cl.status?.workerRun} / ${cl.spec.workerNum}`}
      </DetailsItem>
      <DetailsItem label="Worker Node Type" obj={cl} path="spec.workerType" />
      <DetailsItem label="SSH Key" obj={cl} path="spec.sshKey" />
    </dl>
  );
};

const ClusterDetails: React.FC<ClusterDetailsProps> = ({ obj: cluster }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Cluster Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={cluster} customPathName={'fakeMetadata.fakename'} showOwner={false} />
          <DetailsItem label="Owner" obj={cluster} path="status.owner" />
        </div>
        <div className="col-lg-6">
          <ClusterDetailsList cl={cluster} />
        </div>
      </div>
    </div>
  </>
);

const { details, /* nodes, */ editYaml /*, events */ } = navFactory;
export const Clusters: React.FC = props => <Table {...props} aria-label="Clusters" Header={ClusterTableHeader} Row={ClusterTableRow} virtualize />;

export const ClustersPage: React.FC<ClustersPageProps> = props => {
  return <ListPage ListComponent={Clusters} kind={kind} {...props} />;
};
export const ClustersDetailsPage: React.FC<ClustersDetailsPageProps> = props => {
  return <DetailsPage {...props} titleFunc={(obj: any) => obj.fakeMetadata.fakename} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ClusterDetails)), editYaml() /* nodes(ClusterNodes),  events(ResourceEventStream) */]} />;
};

interface IClusterTableRow extends K8sResourceKind {
  fakeMetadata: any;
}

type ClusterDetailsListProps = {
  cl: K8sResourceKind;
};

type ClusterDetailsProps = {
  obj: K8sResourceKind;
};

type ClustersPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ClustersDetailsPageProps = {
  match: any;
};

// type ClusterNodesProps = {
//   obj: K8sResourceKind;
// };
