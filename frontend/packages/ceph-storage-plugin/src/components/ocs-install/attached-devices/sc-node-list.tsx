import * as React from 'react';
import * as _ from 'lodash';
import { IRow } from '@patternfly/react-table';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils/';
import { Table } from '@console/internal/components/factory';
import { NodeKind } from '@console/internal/module/k8s';
import { getConvertedUnits } from '../../../utils/install';
import { getColumns } from '../node-list';
import { GetRows, NodeTableProps } from '../types';
import '../ocs-install.scss';

const getRows: GetRows = ({ componentProps }) => {
  const { data } = componentProps;

  const rows = data.map((node) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={getName(node)} title={getName(node)} />,
      },
      {
        title: roles.join(', ') || '-',
      },
      {
        title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
      },
      {
        title: `${getConvertedUnits(memSpec)}`,
      },
      {
        title: node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] || '-',
      },
    ];
    return {
      cells,
      props: {
        id: node.metadata.uid,
      },
    };
  });

  return rows;
};

const AttachedDevicesNodeTable: React.FC<NodeTableProps> = (props) => {
  const { data, customData } = props;
  const { filteredNodes, nodes = [], setNodes } = customData;
  const tableData: NodeKind[] = data.filter(
    (node: NodeKind) =>
      filteredNodes.includes(getName(node)) ||
      filteredNodes.includes(node.metadata.labels?.['kubernetes.io/hostname']),
  );

  React.useEffect(() => {
    if (setNodes && !_.isEqual(tableData, nodes)) {
      setNodes(tableData);
    }
  }, [tableData, setNodes, nodes, filteredNodes]);

  return (
    <div className="ceph-ocs-install__select-nodes-table">
      <Table
        {...props}
        aria-label="Node Table"
        data-test-id="attached-devices-nodes-table"
        data={tableData}
        Rows={getRows}
        Header={getColumns}
        virtualize={false}
      />
    </div>
  );
};

export default AttachedDevicesNodeTable;
