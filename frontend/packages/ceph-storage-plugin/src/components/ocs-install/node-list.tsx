import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
  hasLabel,
} from '@console/shared';
import { humanizeCpuCores, ResourceLink, pluralize } from '@console/internal/components/utils/';
import { NodeKind } from '@console/internal/module/k8s';
import { Table } from '@console/internal/components/factory';
import { IRow, OnSelect } from '@patternfly/react-table';
import { hasOCSTaint, hasTaints, getConvertedUnits } from '../../utils/install';
import { cephStorageLabel } from '../../selectors';
import './ocs-install.scss';

const tableColumnClasses = [
  classNames('col-md-1', 'col-sm-1', 'col-xs-1'),
  classNames('col-md-4', 'col-sm-8', 'col-xs-11'),
  classNames('col-md-2', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-1', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
];

const getColumns = () => {
  return [
    {
      title: 'Name',
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Role',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Location',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'CPU',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Memory',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

const getSelected = (selected: NodeKind[], nodeUID: string) =>
  selected.map((node) => node.metadata.uid).includes(nodeUID);

type GetRows = ({
  componentProps,
  customData,
}: {
  componentProps: { data: NodeKind[] };
  customData: {
    selectedNodes: NodeKind[];
    setSelectedNodes: React.Dispatch<React.SetStateAction<NodeKind[]>>;
    visibleRows: NodeKind[];
    setVisibleRows: React.Dispatch<React.SetStateAction<NodeKind[]>>;
  };
}) => NodeTableRow[];

const getRows: GetRows = ({ componentProps, customData }) => {
  const { data } = componentProps;
  const { selectedNodes, setSelectedNodes, setVisibleRows, visibleRows } = customData;

  const filteredData = data.filter((node: NodeKind) => hasOCSTaint(node) || !hasTaints(node));

  const rows = filteredData.map((node: NodeKind) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={getName(node)} title={node.metadata.uid} />,
      },
      {
        title: roles.join(', ') || '-',
      },
      {
        title: node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] || '-',
      },
      {
        title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
      },
      {
        title: `${getConvertedUnits(memSpec)}`,
      },
    ];
    return {
      cells,
      selected: _.isArray(selectedNodes)
        ? getSelected(selectedNodes, node.metadata.uid)
        : hasLabel(node, cephStorageLabel),
      props: {
        id: node.metadata.uid,
      },
    };
  });

  if (!_.isEqual(filteredData, visibleRows)) {
    setVisibleRows(filteredData);
    if (!selectedNodes && filteredData.length) {
      const preSelected = filteredData.filter((row) => hasLabel(row, cephStorageLabel));
      setSelectedNodes(preSelected);
    }
  }
  return rows;
};

const NodeTable: React.FC<NodeTableProps> = (props) => {
  const { selectedNodes, setSelectedNodes, visibleRows } = props.customData;

  const onSelect: OnSelect = (_event, isSelected, rowIndex, rowData) => {
    const selectedUIDs = selectedNodes?.map((node) => node.metadata.uid) ?? [];
    const visibleUIDs = visibleRows?.map((row) => row.metadata.uid);
    if (rowIndex === -1) {
      if (isSelected) {
        const uniqueUIDs = _.uniq([...visibleUIDs, ...selectedUIDs]);
        setSelectedNodes(
          _.uniqBy(
            [...visibleRows, ...selectedNodes].filter((node) =>
              uniqueUIDs.includes(node.metadata.uid),
            ),
            (n) => n.metadata.uid,
          ),
        );
      } else {
        setSelectedNodes(
          _.uniqBy(
            selectedNodes.filter((node) => !visibleUIDs.includes(node.metadata.uid)),
            (n) => n.metadata.uid,
          ),
        );
      }
    } else {
      const uniqueUIDs = _.xor(selectedUIDs, [rowData.props.id]);
      const data = _.uniqBy(
        [...visibleRows, ...selectedNodes].filter((node) => uniqueUIDs.includes(node.metadata.uid)),
        (n) => n.metadata.uid,
      );
      setSelectedNodes(data);
    }
  };

  return (
    <>
      <div className="ceph-node-list__max-height">
        <Table
          aria-label="Node Table"
          data-test-id="select-nodes-table"
          {...props}
          Rows={getRows}
          Header={getColumns}
          virtualize={false}
          onSelect={onSelect}
        />
      </div>
      <p className="control-label help-block" data-test-id="nodes-selected">
        {`${pluralize(selectedNodes?.length || 0, 'node')} selected`}
      </p>
    </>
  );
};

export default NodeTable;

type NodeTableProps = {
  data: NodeKind[];
  customData: {
    selectedNodes: NodeKind[];
    setSelectedNodes: React.Dispatch<React.SetStateAction<NodeKind[]>>;
    visibleRows: NodeKind[];
    setVisibleRows: React.Dispatch<React.SetStateAction<NodeKind[]>>;
  };
  filters: { name: string; label: { all: string[] } };
};

type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected: boolean;
};
