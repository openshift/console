import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as cx from 'classnames';
import { Table, TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { sortable, SortByDirection } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import { Modal } from '@console/shared';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { DiskMetadata } from '@console/local-storage-operator-plugin/src/components/disks-list/types';
import { DiscoveredDisk } from '../../../../types';

const tableColumnClasses = [
  '',
  '',
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-lg'),
];

const DiskRow: RowFunction<DiscoveredDisk> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.deviceID} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{obj.path}</TableData>
      <TableData className={tableColumnClasses[1]}>{obj.node}</TableData>
      <TableData className={tableColumnClasses[2]}>{obj.type || '-'}</TableData>
      <TableData className={cx(tableColumnClasses[3], 'co-break-word')}>
        {obj.model || '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {humanizeBinaryBytes(obj.size).string || '-'}
      </TableData>
    </TableRow>
  );
};

export const DiskListModal: React.FC<DiskListModalProps> = ({ showDiskList, onCancel, disks }) => {
  const { t } = useTranslation();

  const DiskHeader = () => {
    return [
      {
        title: t('ceph-storage-plugin~Name'),
        sortField: 'path',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('ceph-storage-plugin~Node'),
        sortField: 'node',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('ceph-storage-plugin~Type'),
        sortField: 'type',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('ceph-storage-plugin~Model'),
        sortField: 'model',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('ceph-storage-plugin~Capacity'),
        sortField: 'size',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
    ];
  };

  return (
    <Modal
      title={t('ceph-storage-plugin~Selected Disks')}
      isOpen={showDiskList}
      onClose={onCancel}
      className="ceph-ocs-install__filtered-modal"
      actions={[
        <Button key="confirm" variant="primary" onClick={onCancel}>
          {t('ceph-storage-plugin~Close')}
        </Button>,
      ]}
    >
      <Table
        data={disks}
        defaultSortField="node"
        defaultSortOrder={SortByDirection.asc}
        aria-label={t('ceph-storage-plugin~Disk List')}
        Header={DiskHeader}
        Row={DiskRow}
        loaded={!!disks}
        virtualize
      />
    </Modal>
  );
};

type DiskListModalProps = {
  showDiskList: boolean;
  disks: DiskMetadata[];
  onCancel: () => void;
};
