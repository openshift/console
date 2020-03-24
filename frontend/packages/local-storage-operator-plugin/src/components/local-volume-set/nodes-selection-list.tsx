import * as React from 'react';
import * as _ from 'lodash';
import { Text, pluralize } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { sortable, OnSelect } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import {
  ResourceLink,
  humanizeBinaryBytes,
  convertToBaseValue,
} from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { getUID, getName, getNodeCPUCapacity, getNodeAllocatableMemory } from '@console/shared';
import { NodeTableRow, RowUIDMap } from './types';
import { getSelectedNodeUIDs } from './utils';
import './node-selection-list.scss';

const tableColumnClasses = [
  classNames('pf-u-w-30-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-20-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-20-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-20-on-sm'),
];

const setTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'CPU',
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Memory',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Location',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Taints',
      props: { className: tableColumnClasses[3] },
    },
  ];
};

const stateShouldUpdate = (rowUIDMap: RowUIDMap, rows: RowUIDMap): boolean => {
  /* On initial render rows will be empty */
  if (_.isEmpty(rows)) return true;
  return Object.keys(rowUIDMap).some((uid) => rows?.[uid]?.selected !== rowUIDMap?.[uid]?.selected);
};

const createNodeUIDMap = (nodes: NodeKind[]): NodeUIDMap =>
  nodes.reduce((nodeUIDMap: NodeUIDMap, node: NodeKind) => {
    const uid = getUID(node);
    nodeUIDMap[uid] = node;
    return nodeUIDMap;
  }, {});

const createRowUIDMap = (nodeUIDMap: NodeUIDMap, rows: RowUIDMap): RowUIDMap =>
  Object.keys(nodeUIDMap).reduce((rowUIDMap, uid: string) => {
    const node = nodeUIDMap[uid];
    const nodeName = getName(node);
    const nodeLocation = node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] ?? '-';
    const nodeCpuCapacity = getNodeCPUCapacity(node);
    const nodeAllocatableMemory = getNodeAllocatableMemory(node);
    const nodeTaints = node.spec?.taints?.length ?? 0;
    const cells = [
      {
        title: <ResourceLink kind="Node" name={nodeName} title={uid} />,
      },
      {
        title: nodeCpuCapacity || '-',
      },
      {
        title: humanizeBinaryBytes(convertToBaseValue(nodeAllocatableMemory)).string || '-',
      },
      {
        title: nodeLocation || '-',
      },
      {
        title: pluralize(nodeTaints, 'taint'),
      },
    ];
    rowUIDMap[uid] = {
      cells,
      selected: rows?.[uid]?.selected ?? false,
      props: {
        data: nodeUIDMap[uid],
        uid,
      },
    };
    return rowUIDMap;
  }, {});

const setTableRows: SetTableRows = ({ componentProps, customData }) => {
  const { data: filteredData } = componentProps;
  const { rows, setRows, allSelected, setAllSelected } = customData;

  const nodeUIDMap = createNodeUIDMap(filteredData);
  const rowUIDMap = createRowUIDMap(nodeUIDMap, rows);
  const tableRows = Object.values(rowUIDMap);

  if (allSelected !== null) {
    /* Selecting and deselecting visible table rows */
    Object.keys(rowUIDMap).forEach((uid) => (rowUIDMap[uid].selected = allSelected));
    setRows({ ...rows, ...rowUIDMap });
    setAllSelected(null);
  } else if (!_.isEmpty(rowUIDMap) && stateShouldUpdate(rowUIDMap, rows)) {
    setRows({ ...rows, ...rowUIDMap });
  }
  return tableRows;
};

export const NodesSelectionList: React.FC<NodesSelectionListProps> = (props) => {
  const { rows, setRows, setAllSelected } = props.customData;

  const onSelectTableRows: OnSelect = (_event, isSelected, rowId, rowData) => {
    const updatedRows: RowUIDMap = { ...rows };
    if (rowId === -1) {
      setAllSelected(isSelected);
    } else {
      const { uid } = rowData.props;
      updatedRows[uid].selected = isSelected;
      setRows({ ...updatedRows });
    }
  };

  return (
    <>
      <div className="lso-node-selection-table__table--scroll">
        <Table
          {...props}
          aria-label="Select nodes for creating volume filter"
          data-test-id="create-lvs-form-node-selection-table"
          Header={setTableHeader}
          Rows={setTableRows}
          onSelect={onSelectTableRows}
          customData={props.customData}
          virtualize={false}
        />
      </div>
      <Text data-test-id="create-lvs-form-selected-nodes" component="h6">
        {pluralize(getSelectedNodeUIDs(rows).length, 'node')} selected
      </Text>
    </>
  );
};

type NodesSelectionListProps = {
  data: NodeKind[];
  customData: {
    allSelected: boolean;
    rows: RowUIDMap;
    setAllSelected: React.Dispatch<React.SetStateAction<boolean>>;
    setRows: React.Dispatch<React.SetStateAction<RowUIDMap>>;
  };
};

type SetTableRows = (props: {
  componentProps: { data: NodeKind[] };
  customData: NodesSelectionListProps['customData'];
}) => NodeTableRow[];

type NodeUIDMap = {
  [key: string]: NodeKind;
};
