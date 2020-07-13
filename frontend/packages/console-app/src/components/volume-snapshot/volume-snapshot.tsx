import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { referenceForModel, VolumeSnapshotKind } from '@console/internal/module/k8s';
import {
  ResourceLink,
  ResourceKebab,
  Timestamp,
  Kebab,
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import {
  TableRow,
  TableData,
  ListPage,
  Table,
  RowFunction,
} from '@console/internal/components/factory';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import { Status } from '@console/shared';
import { volumeSnapshotStatus } from '../../status';

const tableColumnClasses = [
  '', // Name
  '', // Namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // Status
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // Size
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // PVC
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Snapshot Content
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Snapshot Class
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Created At
  Kebab.columnClass,
];

const Header = () => [
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
    sortFunc: 'snapshotStatus',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Size',
    sortFunc: 'volumeSnapshotSize',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'PVC',
    sortField: 'spec.source.persistentVolumeClaimName',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: 'Snapshot Content',
    sortField: 'status.boundVolumeSnapshotContentName',
    transforms: [sortable],
    props: { className: tableColumnClasses[5] },
  },
  {
    title: 'Snapshot Class',
    sortField: 'spec.volumeSnapshotClassName',
    transforms: [sortable],
    props: { className: tableColumnClasses[6] },
  },
  {
    title: 'Created At',
    sortField: 'metadata.creationTimeStamp',
    transforms: [sortable],
    props: { className: tableColumnClasses[7] },
  },
  {
    title: '',
    props: { className: tableColumnClasses[8] },
  },
];

const Row: RowFunction<VolumeSnapshotKind> = ({ key, obj, style, index }) => {
  const { name, namespace, creationTimestamp } = obj?.metadata || {};
  const size = obj.status?.restoreSize;
  const sizeBase = convertToBaseValue(size);
  const sizeMetrics = size ? humanizeBinaryBytes(sizeBase).string : '-';
  const pvcName = obj?.spec?.source?.persistentVolumeClaimName;
  const snapshotContent = obj?.status?.boundVolumeSnapshotContentName;
  return (
    <TableRow id={obj?.metadata?.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={volumeSnapshotStatus(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{sizeMetrics}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceLink kind={PersistentVolumeClaimModel.kind} name={pvcName} namespace={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {snapshotContent ? (
          <ResourceLink
            kind={referenceForModel(VolumeSnapshotContentModel)}
            name={snapshotContent}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotClassModel)}
          name={obj?.spec?.volumeSnapshotClassName}
        />
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </TableRow>
  );
};

const filters = [
  {
    filterGroupName: 'Status',
    type: 'snapshot-status',
    reducer: volumeSnapshotStatus,
    items: [
      { id: 'Ready', title: 'Ready' },
      { id: 'Pending', title: 'Pending' },
      { id: 'Error', title: 'Error' },
    ],
  },
];

const VolumeSnapshotTable: React.FC = (props) => (
  <Table {...props} aria-label="Volume Snapshot Table" Header={Header} Row={Row} virtualize />
);

const VolumeSnapshotPage: React.FC = (props) => {
  return (
    <ListPage
      {...props}
      kind={referenceForModel(VolumeSnapshotModel)}
      ListComponent={VolumeSnapshotTable}
      rowFilters={filters}
    />
  );
};

export default VolumeSnapshotPage;
