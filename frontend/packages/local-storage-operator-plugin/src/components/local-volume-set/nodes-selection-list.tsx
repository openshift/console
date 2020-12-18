import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { Text } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { sortable, IRow } from '@patternfly/react-table';
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
import { hasNoTaints } from '../../utils';
import { GetRows } from './types';
import './node-selection-list.scss';

const tableColumnClasses = [
  classNames('pf-u-w-40-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
];

const getRows: GetRows = (
  { componentProps, customData },
  visibleRows,
  setVisibleRows,
  selectedNodes,
  setSelectedNodes,
) => {
  const { data } = componentProps;
  const { filteredNodes, preSelected, taintsFilter } = customData;

  const nodeList = filteredNodes?.length ? filteredNodes : data.map(getName);
  const filteredData = data.filter((node: NodeKind) =>
    taintsFilter
      ? (taintsFilter(node) || hasNoTaints(node)) && nodeList.includes(getName(node))
      : hasNoTaints(node) && nodeList.includes(getName(node)),
  );

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
        title: node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] ?? '-',
      },
      {
        title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
      },
      {
        title: humanizeBinaryBytes(convertToBaseValue(memSpec)).string ?? '-',
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
    if (preSelected && !selectedNodes?.size && filteredData.length) {
      const preSelectedRows = filteredData.filter((node) => preSelected.includes(getName(node)));
      setSelectedNodes(preSelectedRows);
    }
  }
  return rows;
};

export const NodesSelectionList: React.FC<NodesSelectionListProps> = (props) => {
  const { t } = useTranslation();
  const [visibleRows, setVisibleRows] = React.useState<Set<string>>(new Set());

  const {
    onSelect,
    selectedRows: selectedNodes,
    updateSelectedRows: setSelectedNodes,
  } = useSelectList<NodeKind>(props.data, visibleRows, props.customData.onRowSelected);

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
      title: t('lso-plugin~Zone'),
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('lso-plugin~CPU'),
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('lso-plugin~Memory'),
      props: { className: tableColumnClasses[4] },
    },
  ];

  return (
    <>
      <div
        className={classNames(
          'lso-node-selection-table__table--scroll',
          props.customData.className,
        )}
      >
        <Table
          {...props}
          aria-label={t('lso-plugin~Select nodes for creating volume filter')}
          data-test-id="create-lvs-form-node-selection-table"
          Header={getColumns}
          Rows={(rowProps) =>
            getRows(rowProps, visibleRows, setVisibleRows, selectedNodes, setSelectedNodes)
          }
          customData={props.customData}
          virtualize={false}
          onSelect={onSelect}
        />
      </div>
      <Text data-test-id="create-lvs-form-selected-nodes" component="h6">
        {t('lso-plugin~{{nodeCount, number}} node', {
          nodeCount: selectedNodes?.size,
          count: selectedNodes?.size,
        })}{' '}
        {t('lso-plugin~selected')}
      </Text>
    </>
  );
};

type NodesSelectionListProps = {
  data: NodeKind[];
  customData: {
    onRowSelected: (nodes: NodeKind[]) => void;
    className?: string;
    preSelected?: string[];
  };
};
