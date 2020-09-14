import * as React from 'react';
import * as cx from 'classnames';
import { Table, TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { sortable, SortByDirection } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import { Modal } from '@console/shared';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { Discoveries, State, Action } from '../state';

const tableColumnClasses = [
  '',
  '',
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-lg'),
];

export const DiskHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'path',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Node',
      sortField: 'node',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Type',
      sortField: 'type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Model',
      sortField: 'model',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Capacity',
      sortField: 'size',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
  ];
};

const DiskRow: RowFunction<Discoveries> = ({ obj, index, key, style }) => {
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

export const DiskListModal: React.FC<DiskListModalProps> = ({ state, dispatch }) => {
  const cancel = () => {
    dispatch({ type: 'setShowDiskList', value: false });
  };

  return (
    <Modal
      title="Selected Disks"
      isOpen={state.showDiskList}
      onClose={cancel}
      className="ceph-ocs-install__filtered-modal"
      actions={[
        <Button key="confirm" variant="primary" onClick={cancel}>
          Close
        </Button>,
      ]}
    >
      <Table
        data={state.filteredDiscoveries}
        defaultSortField="node"
        defaultSortOrder={SortByDirection.asc}
        aria-label="Disk List"
        Header={DiskHeader}
        Row={DiskRow}
        loaded={!!state.filteredDiscoveries}
        virtualize
      />
    </Modal>
  );
};

type DiskListModalProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
