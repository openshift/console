import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { TableData, ListPage, Table, RowFunctionArgs } from '@console/internal/components/factory';
import {
  ResourceLink,
  ResourceKebab,
  Timestamp,
  Kebab,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import {
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import { referenceForModel, VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';

const tableColumnClasses = [
  '', // Name
  classnames('pf-m-hidden', 'pf-m-visible-on-lg'), // Status
  classnames('pf-m-hidden', 'pf-m-visible-on-lg'), // Size
  classnames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Volume Snapshot
  classnames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Snapshot Class
  classnames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Created At
  Kebab.columnClass,
];

const Row: React.FC<RowFunctionArgs<VolumeSnapshotContentKind>> = ({ obj }) => {
  const { name, creationTimestamp } = obj?.metadata || {};
  const { name: snapshotName, namespace: snapshotNamespace } = obj?.spec?.volumeSnapshotRef || {};
  const size = obj.status?.restoreSize;
  const sizeMetrics = size ? humanizeBinaryBytes(size).string : '-';
  return (
    <>
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
          kind={referenceForModel(VolumeSnapshotContentModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </>
  );
};

const VolumeSnapshotContentTable: React.FC = (props) => {
  const { t } = useTranslation();
  const VolumeSnapshotContentTableHeader = () => {
    return [
      {
        title: t('console-app~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('console-app~Status'),
        sortFunc: 'snapshotStatus',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('console-app~Size'),
        sortFunc: 'volumeSnapshotSize',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('console-app~VolumeSnapshot'),
        sortField: 'spec.volumeSnapshotRef.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('console-app~SnapshotClass'),
        sortField: 'spec.volumeSnapshotClassName',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('console-app~Created at'),
        sortField: 'metadata.creationTimeStamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[6] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={VolumeSnapshotContentModel.labelPlural}
      Header={VolumeSnapshotContentTableHeader}
      Row={Row}
      virtualize
    />
  );
};

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
