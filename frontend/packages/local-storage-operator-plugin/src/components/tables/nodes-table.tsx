import * as React from 'react';
import { Text } from '@patternfly/react-core';
import { sortable, IRow } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import {
  ResourceLink,
  humanizeBinaryBytes,
  humanizeCpuCores,
  convertToBaseValue,
} from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { useSelectList } from '@console/shared/src/hooks/select-list';
import { getZone, hasNoTaints } from '../../utils';
import { NodesTableRowsFunction, NodesTableCustomData } from './types';
import './nodes-table.scss';

const tableColumnClasses = [
  classNames('pf-u-w-40-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
];

const getRows: NodesTableRowsFunction = (
  { componentProps, customData },
  visibleRows,
  setVisibleRows,
  selectedNodes,
  setSelectedNodes,
) => {
  const { data } = componentProps;
  const { filteredNodes, preSelectedNodes, taintsFilter } = customData;
  let filteredData: NodeKind[] = data;

  if (filteredNodes?.length) {
    /**
     * Only the nodes present in `filteredNodes` will be displayed.
     * These nodes are already filtered for taints e.g nodes passed
     * from discovery step to create storage class in ocs.
     */
    filteredData = data.filter((node: NodeKind) => filteredNodes.includes(getName(node)));
  } else {
    /* Remove all tainted nodes, or allow some tainted nodes based on `taintsFilter` */
    filteredData = filteredData.filter(
      (node) => hasNoTaints(node) || (taintsFilter && taintsFilter(node)),
    );
  }

  const rows = filteredData.map((node: NodeKind) => {
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const roles = getNodeRoles(node).sort();
    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={getName(node)} title={getName(node)} />,
      },
      {
        title: roles.join(', ') ?? '-',
      },
      {
        title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
      },
      {
        title: humanizeBinaryBytes(convertToBaseValue(memSpec)).string ?? '-',
      },
      {
        title: getZone(node) ?? '-',
      },
    ];
    return {
      cells,
      selected: selectedNodes.has(node.metadata.uid),
      props: {
        id: node.metadata.uid,
      },
    };
  });

  const uids = new Set(filteredData.map((n) => n.metadata.uid));

  if (!_.isEqual(uids, visibleRows)) {
    setVisibleRows(uids);
    if (preSelectedNodes?.length && !selectedNodes?.size && filteredData.length) {
      const preSelectedRows = filteredData.filter((node) =>
        preSelectedNodes.includes(getName(node)),
      );
      setSelectedNodes(preSelectedRows);
    }
  }
  return rows;
};

export const NodesTable: React.FC<NodesTableProps> = (props) => {
  const { t } = useTranslation();
  const [visibleRows, setVisibleRows] = React.useState<Set<string>>(new Set());

  const { hasOnSelect, onRowSelected } = props.customData;

  const {
    onSelect,
    selectedRows: selectedNodes,
    updateSelectedRows: setSelectedNodes,
  } = useSelectList<NodeKind>(props.data, visibleRows, onRowSelected);

  const getColumns = () => [
    {
      title: t('lso-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('lso-plugin~Role'),
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('lso-plugin~CPU'),
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('lso-plugin~Memory'),
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('lso-plugin~Zone'),
      props: { className: tableColumnClasses[4] },
    },
  ];

  return (
    <>
      <div className="lso-node-selection-table__table--scroll">
        <Table
          {...props}
          aria-label={t('lso-plugin~Select nodes for creating volume filter')}
          data-test-id="create-lvs-form-node-selection-table"
          Header={getColumns}
          Rows={(rowProps) =>
            getRows(rowProps, visibleRows, setVisibleRows, selectedNodes, setSelectedNodes)
          }
          customData={props.customData}
          onSelect={hasOnSelect && onSelect}
          virtualize={false}
        />
      </div>
      {hasOnSelect && (
        <Text data-test-id="create-lvs-form-selected-nodes" component="h6">
          {t('lso-plugin~{{nodeCount, number}} node', {
            nodeCount: selectedNodes?.size,
            count: selectedNodes?.size,
          })}{' '}
          {t('lso-plugin~selected')}
        </Text>
      )}
    </>
  );
};

type NodesTableProps = {
  data: NodeKind[];
  customData: NodesTableCustomData;
};
