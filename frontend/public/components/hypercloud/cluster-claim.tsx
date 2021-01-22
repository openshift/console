import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceIcon, ResourceSummary, SectionHeading, DetailsItem } from '../utils';
import { Status } from '@console/shared';
import { ClusterClaimModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ClusterClaimModel), ...Kebab.factory.common, Kebab.factory.ModifyClaim];

const kind = ClusterClaimModel.kind;

const tableColumnClasses = ['', '', '', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ClusterClaimTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_LNB_MENU_84'),
      sortFunc: 'spec.clusterName',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_59'),
      sortFunc: 'spec.provider',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_62'),
      sortFunc: 'spec.version',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_11'),
      sortField: 'metadata.annotations.creator',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[7] },
    },
  ];
};
ClusterClaimTableHeader.displayName = 'ClusterClaimTableHeader';

const ClusterClaimTableRow: RowFunction<K8sResourceKind> = ({ obj: clusterClaim, index, key, style }) => {
  return (
    <TableRow id={clusterClaim.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={clusterClaim.metadata.name} namespace={clusterClaim.metadata.namespace} title={clusterClaim.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{clusterClaim.spec.clusterName}</TableData>
      <TableData className={tableColumnClasses[2]}>{clusterClaim.spec.provider}</TableData>
      <TableData className={tableColumnClasses[3]}>{clusterClaim.spec.version}</TableData>
      <TableData className={classNames(tableColumnClasses[4], 'co-break-word')}>
        <Status status={clusterClaim.status.phase} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>{clusterClaim.metadata.annotations.creator}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <Timestamp timestamp={clusterClaim.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={clusterClaim} />
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

export const ClusterClaimDetailsList: React.FC<ClusterClaimDetailsListProps> = ({ clcl }) => {
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label="Provider" obj={clcl} path="spec.provider" />
      <DetailsItem label="Cluster Name" obj={clcl} path="spec.clusterName" />
      <DetailsItem label="Version" obj={clcl} path="spec.version" />
      <DetailsItem label="Region" obj={clcl} path="spec.region" />
      <DetailsItem label="Master Node Count" obj={clcl} path="spec.masterNum" />
      <DetailsItem label="Master Node Type" obj={clcl} path="spec.masterType" />
      <DetailsItem label="Worker Node Count" obj={clcl} path="spec.workerNum" />
      <DetailsItem label="Worker Node Type" obj={clcl} path="spec.workerType" />
      <DetailsItem label="SSH Key" obj={clcl} path="spec.sshKey" />
    </dl>
  );
};

const ClusterClaimDetails: React.FC<ClusterClaimDetailsProps> = ({ obj: clusterClaim }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Cluster Claim Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={clusterClaim} showOwner={false} />
          <DetailsItem label="Owner" obj={clusterClaim} path="metadata.annotations.creator" />
        </div>
        <div className="col-lg-6">
          <ClusterClaimDetailsList clcl={clusterClaim} />
        </div>
      </div>
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const ClusterClaims: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Cluster Claims" Header={ClusterClaimTableHeader.bind(null, t)} Row={ClusterClaimTableRow} virtualize />;
};

const clusterClaimStatusReducer = (clusterClaim: any): string => {
  return clusterClaim.status.phase;
};
const filters = [
  {
    filterGroupName: 'Status',
    type: 'registry-status',
    reducer: clusterClaimStatusReducer,
    items: [
      { id: 'Created', title: 'Created' },
      { id: 'Waiting', title: 'Waiting' },
      { id: 'Admitted', title: 'Admitted' },
      { id: 'Success', title: 'Success' },
      { id: 'Rejected', title: 'Rejected' },
      { id: 'Error', title: 'Error' },
      { id: 'Deleted', title: 'Deleted' },
    ],
  },
];

export const ClusterClaimsPage: React.FC<ClusterClaimsPageProps> = props => <ListPage canCreate={true} ListComponent={ClusterClaims} kind={kind} rowFilters={filters} {...props} />;

export const ClusterClaimsDetailsPage: React.FC<ClusterClaimsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ClusterClaimDetails)), editYaml()]} />;

type ClusterRowProps = {
  pod: K8sResourceKind;
};

type ClusterClaimDetailsListProps = {
  clcl: K8sResourceKind;
};

type ClusterClaimDetailsProps = {
  obj: K8sResourceKind;
};

type ClusterClaimsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ClusterClaimsDetailsPageProps = {
  match: any;
};
