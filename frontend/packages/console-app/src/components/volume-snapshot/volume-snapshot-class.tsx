import * as React from 'react';
import * as classNames from 'classnames';
import { Kebab, ResourceKebab, ResourceLink } from '@console/internal/components/utils';
import { sortable } from '@patternfly/react-table';
import { referenceForModel, VolumeSnapshotClassKind } from '@console/internal/module/k8s';
import {
  TableRow,
  TableData,
  Table,
  ListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { VolumeSnapshotClassModel } from '@console/internal/models';

const tableColumnClasses = [
  '', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // Driver
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // Deletion Policy
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
    title: 'Driver',
    sortField: 'driver',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Deletion Policy',
    sortField: 'deletionPolicy',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: '',
    props: { className: tableColumnClasses[3] },
  },
];

const Row: RowFunction<VolumeSnapshotClassKind> = ({ obj, index, style, key }) => {
  const { name } = obj?.metadata || {};
  const { deletionPolicy, driver } = obj || {};
  return (
    <TableRow id={obj?.metadata?.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink name={name} kind={referenceForModel(VolumeSnapshotClassModel)} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{driver}</TableData>
      <TableData className={tableColumnClasses[2]}>{deletionPolicy}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotClassModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </TableRow>
  );
};

const VolumeSnapshotClassTable: React.FC = (props) => (
  <Table {...props} aria-label="Volume Snapshot Class Table" Header={Header} Row={Row} />
);

const VolumeSnapshotClassPage: React.FC = (props) => (
  <ListPage
    {...props}
    ListComponent={VolumeSnapshotClassTable}
    kind={referenceForModel(VolumeSnapshotClassModel)}
    canCreate
  />
);

export default VolumeSnapshotClassPage;
