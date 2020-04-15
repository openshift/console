import './_volume-snapshot.scss';

import * as React from 'react';
import * as classNames from 'classnames';

import {
  DetailsPage,
  ListPage,
  Table,
  TableData,
  TableProps,
  TableRow,
  RowFunction,
} from '@console/internal/components/factory';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
  PageComponentProps,
} from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';

import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VolumeSnapshotModel } from '../../models';
import { getResourceActions } from '../../utils/resource-actions';
import { sortable } from '@patternfly/react-table';
import { volumeSnapshotModal } from '../modals/volume-snapshot-modal/volume-snapshot-modal';

const snapshotMenuActions = [...getResourceActions(VolumeSnapshotModel)];

const snapshotTableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'),
  Kebab.columnClass,
];

const VolumeSnapshotTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[0] },
    },
    {
      title: 'Date',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[2] },
    },
    {
      title: 'Size',
      sortField: 'status.restoreSize',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[3] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: snapshotTableColumnClasses[5] },
    },
  ];
};
VolumeSnapshotTableHeader.displayName = 'SnapshotTableHeader';

const volumeSnapshotKind = referenceFor(VolumeSnapshotModel);

const { details } = navFactory;

const breadcrumbsForSnapshotDetailsPage = (match: any) => () => [
  {
    name: PersistentVolumeClaimModel.labelPlural,
    path: `/k8s/ns/${match.params.ns}/persistentvolumeclaims`,
  },
  {
    name: 'Snapshot Details',
    path: `${match.url}`,
  },
];

const DetailsComponent = ({ obj: volumeSnapshot }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Volume Snapshot Details" />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={volumeSnapshot}>
            <dt>Status</dt>
            <dd>{volumeSnapshot.status.readyToUse ? 'Ready' : 'Not Ready'}</dd>
            <dt>Size</dt>
            <dd>{volumeSnapshot.status.restoreSize || 'No Data'}</dd>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <dt>Persistent Volume Claim</dt>
          <dd>
            <ResourceLink
              kind={PersistentVolumeClaimModel.kind}
              name={volumeSnapshot.spec.source.persistentVolumeClaimName}
              namespace={getNamespace(volumeSnapshot)}
            />
          </dd>
        </div>
      </div>
    </div>
  </>
);

export const VolumeSnapshotDetails = (props) => (
  <DetailsPage
    {...props}
    menuActions={snapshotMenuActions}
    kind={referenceFor(VolumeSnapshotModel)}
    name={props.match.params.name}
    kindObj={VolumeSnapshotModel}
    namespace={props.match.params.ns}
    pages={[details(DetailsComponent)]}
    breadcrumbsFor={breadcrumbsForSnapshotDetailsPage(props.match)}
  />
);

const VolumeSnapshotTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={snapshotTableColumnClasses[0]}>
      <ResourceLink
        kind={referenceFor(VolumeSnapshotModel)}
        name={getName(obj)}
        namespace={getNamespace(obj)}
        title={getName(obj)}
      />
    </TableData>
    <TableData className={snapshotTableColumnClasses[1]}>
      {obj?.metadata?.creationTimestamp}
    </TableData>
    <TableData className={snapshotTableColumnClasses[2]}>
      {obj?.status?.readyToUse ? 'Ready' : 'Not Ready'}
    </TableData>
    <TableData className={snapshotTableColumnClasses[3]}>
      {obj?.status?.restoreSize || 'No Data'}
    </TableData>
    <TableData className={snapshotTableColumnClasses[4]}>None</TableData>
    <TableData className={snapshotTableColumnClasses[5]}>
      <ResourceKebab actions={snapshotMenuActions} kind={volumeSnapshotKind} resource={obj} />
    </TableData>
  </TableRow>
);

export const VolumeSnapshotList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Volume Snapshot"
    Header={VolumeSnapshotTableHeader}
    Row={VolumeSnapshotTableRow}
    virtualize
  />
);

export const VolumeSnapshotPage: React.FC<PageComponentProps> = ({ obj }) => (
  <ListPage
    canCreate
    kind={volumeSnapshotKind}
    ListComponent={VolumeSnapshotList}
    showTitle={false}
    namespace={obj.metadata.namespace}
    createHandler={() => volumeSnapshotModal({ resource: obj })}
  />
);
