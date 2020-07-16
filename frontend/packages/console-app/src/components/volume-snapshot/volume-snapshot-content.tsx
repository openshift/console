import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { referenceForModel, VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import {
  ResourceLink,
  ResourceKebab,
  Timestamp,
  Kebab,
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
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import { Status } from '@console/shared';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';

const tableColumnClasses = [
  '', // Name
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // Status
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // Size
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Volume Snapshot
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
    title: 'Status',
    sortFunc: 'snapshotStatus',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Size',
    sortFunc: 'volumeSnapshotSize',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Volume Snapshot',
    sortField: 'spec.volumeSnapshotRef.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Snapshot Class',
    sortField: 'spec.volumeSnapshotClassName',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: 'Created At',
    sortField: 'metadata.creationTimeStamp',
    transforms: [sortable],
    props: { className: tableColumnClasses[5] },
  },
  {
    title: '',
    props: { className: tableColumnClasses[6] },
  },
];

const Row: RowFunction<VolumeSnapshotContentKind> = ({ key, obj, style, index }) => {
  const { name, creationTimestamp } = obj?.metadata || {};
  const { name: snapshotName, namespace: snapshotNamespace } = obj?.spec?.volumeSnapshotRef || {};
  const size = obj.status?.restoreSize;
  const sizeMetrics = size ? humanizeBinaryBytes(size).string : '-';
  return (
    <TableRow id={obj?.metadata?.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(VolumeSnapshotContentModel)} name={name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={volumeSnapshotStatus(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{sizeMetrics}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotModel)}
          name={snapshotName}
          namespace={snapshotNamespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotClassModel)}
          name={obj?.spec?.volumeSnapshotClassName}
        />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </TableRow>
  );
};

const VolumeSnapshotContentTable: React.FC = (props) => (
  <Table
    {...props}
    aria-label="Volume Snapshot Content Table"
    Header={Header}
    Row={Row}
    virtualize
  />
);

const VolumeSnapshotContentPage: React.FC = (props) => {
  return (
    <ListPage
      {...props}
      kind={referenceForModel(VolumeSnapshotContentModel)}
      ListComponent={VolumeSnapshotContentTable}
      rowFilters={snapshotStatusFilters}
      canCreate
    />
  );
};

export default VolumeSnapshotContentPage;
