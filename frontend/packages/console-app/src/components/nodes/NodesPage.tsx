import * as React from 'react';
import * as classNames from 'classnames';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect, useSelector } from 'react-redux';
import * as _ from 'lodash';
import { sortable } from '@patternfly/react-table';
import {
  getName,
  getUID,
  getNodeRole,
  getLabels,
  getNodeMachineNameAndNamespace,
} from '@console/shared';
import { NodeModel, MachineModel } from '@console/internal/models';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import {
  Table,
  TableRow,
  TableData,
  ListPage,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  Timestamp,
  humanizeBinaryBytes,
  formatCores,
  LabelList,
} from '@console/internal/components/utils';
import { NodeMetrics, setNodeMetrics } from '@console/internal/actions/ui';
import { PROMETHEUS_BASE_PATH } from '@console/internal/components/graphs';
import { coFetchJSON } from '@console/internal/co-fetch';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { nodeStatus } from '../../status/node';
import NodeRoles from './NodeRoles';
import { menuActions } from './menu-actions';
import NodeStatus from './NodeStatus';
import { RootState } from '@console/internal/redux';

const nodeColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
    title: 'Name',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'Status',
  },
  role: {
    classes: '',
    id: 'role',
    title: 'Role',
  },
  pods: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'pods',
    title: 'Pods',
  },
  memory: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'memory',
    title: 'Memory',
  },
  cpu: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'cpu',
    title: 'CPU',
  },
  filesystem: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'filesystem',
    title: 'Filesystem',
  },
  created: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
    id: 'created',
    title: 'Created',
  },
  instanceType: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'instanceType',
    title: 'Instance type',
  },
  machine: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'machine',
    title: 'Machine',
  },
  labels: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'labels',
    title: 'Labels',
  },
  zone: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'zone',
    title: 'Zone',
  },
});

const columnManagementID = referenceForModel(NodeModel);
const kind = 'Node';

const NodeTableHeader = () => {
  return [
    {
      title: nodeColumnInfo.name.title,
      id: nodeColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: nodeColumnInfo.name.classes },
    },
    {
      title: nodeColumnInfo.status.title,
      id: nodeColumnInfo.status.id,
      sortFunc: 'nodeReadiness',
      transforms: [sortable],
      props: { className: nodeColumnInfo.status.classes },
    },
    {
      title: nodeColumnInfo.role.title,
      id: nodeColumnInfo.role.id,
      sortFunc: 'nodeRoles',
      transforms: [sortable],
      props: { className: nodeColumnInfo.role.classes },
    },
    {
      title: nodeColumnInfo.pods.title,
      id: nodeColumnInfo.pods.id,
      sortFunc: 'nodePods',
      transforms: [sortable],
      props: { className: nodeColumnInfo.pods.classes },
    },
    {
      title: nodeColumnInfo.memory.title,
      id: nodeColumnInfo.memory.id,
      sortFunc: 'nodeMemory',
      transforms: [sortable],
      props: { className: nodeColumnInfo.memory.classes },
    },
    {
      title: nodeColumnInfo.cpu.title,
      id: nodeColumnInfo.cpu.id,
      sortFunc: 'nodeCPU',
      transforms: [sortable],
      props: { className: nodeColumnInfo.cpu.classes },
    },
    {
      title: nodeColumnInfo.filesystem.title,
      id: nodeColumnInfo.filesystem.id,
      sortFunc: 'nodeFS',
      transforms: [sortable],
      props: { className: nodeColumnInfo.filesystem.classes },
    },
    {
      title: nodeColumnInfo.created.title,
      id: nodeColumnInfo.created.id,
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: nodeColumnInfo.created.classes },
    },
    {
      title: nodeColumnInfo.instanceType.title,
      id: nodeColumnInfo.instanceType.id,
      sortFunc: 'nodeInstanceType',
      transforms: [sortable],
      props: { className: nodeColumnInfo.instanceType.classes },
    },
    {
      title: nodeColumnInfo.machine.title,
      id: nodeColumnInfo.machine.id,
      sortFunc: 'nodeMachine',
      transforms: [sortable],
      props: { className: nodeColumnInfo.machine.classes },
      additional: true,
    },
    {
      title: nodeColumnInfo.labels.title,
      id: nodeColumnInfo.labels.id,
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: nodeColumnInfo.labels.classes },
      additional: true,
    },
    {
      title: nodeColumnInfo.zone.title,
      id: nodeColumnInfo.zone.id,
      sortFunc: 'nodeZone',
      transforms: [sortable],
      props: { className: nodeColumnInfo.zone.classes },
      additional: true,
    },
    {
      title: '',
      props: { className: Kebab.columnClass },
    },
  ];
};
NodeTableHeader.displayName = 'NodeTableHeader';

const getSelectedColumns = () => {
  return new Set(
    NodeTableHeader().reduce((acc, column) => {
      if (column.id && !column.additional) {
        acc.push(column.id);
      }
      return acc;
    }, []),
  );
};

const mapStateToProps = ({ UI }) => ({
  metrics: UI.getIn(['metrics', 'node']),
  selectedColumns: UI.getIn(['columnManagement']),
});

type NodesRowMapFromStateProps = {
  metrics: NodeMetrics;
  selectedColumns: Map<string, Set<string>>;
};

const NodesTableRow = connect<NodesRowMapFromStateProps, null, NodesTableRowProps>(mapStateToProps)(
  ({
    obj: node,
    index,
    rowKey,
    style,
    metrics,
    selectedColumns,
  }: NodesTableRowProps & NodesRowMapFromStateProps) => {
    const nodeName = getName(node);
    const nodeUID = getUID(node);
    const usedMem = metrics?.usedMemory?.[nodeName];
    const totalMem = metrics?.totalMemory?.[nodeName];
    const memory =
      Number.isFinite(usedMem) && Number.isFinite(totalMem)
        ? `${humanizeBinaryBytes(usedMem).string} / ${humanizeBinaryBytes(totalMem).string}`
        : '-';
    const cores = metrics?.cpu?.[nodeName];
    const usedStrg = metrics?.usedStorage?.[nodeName];
    const totalStrg = metrics?.totalStorage?.[nodeName];
    const storage =
      Number.isFinite(usedStrg) && Number.isFinite(totalStrg)
        ? `${humanizeBinaryBytes(usedStrg).string} / ${humanizeBinaryBytes(totalStrg).string}`
        : '-';
    const pods = metrics?.pods?.[nodeName] ?? '-';
    const machine = getNodeMachineNameAndNamespace(node);
    const instanceType = node.metadata.labels?.['beta.kubernetes.io/instance-type'];
    const labels = getLabels(node);
    const zone = node.metadata.labels?.['topology.kubernetes.io/zone'];
    const columns = new Set(selectedColumns?.get(columnManagementID) || getSelectedColumns());
    return (
      <TableRow id={nodeUID} index={index} trKey={rowKey} style={style}>
        <TableData className={nodeColumnInfo.name.classes}>
          <ResourceLink kind={referenceForModel(NodeModel)} name={nodeName} title={nodeUID} />
        </TableData>
        <TableData
          className={nodeColumnInfo.status.classes}
          columns={columns}
          columnID={nodeColumnInfo.status.id}
        >
          <NodeStatus node={node} showPopovers />
        </TableData>
        <TableData
          className={nodeColumnInfo.role.classes}
          columns={columns}
          columnID={nodeColumnInfo.role.id}
        >
          <NodeRoles node={node} />
        </TableData>
        <TableData
          className={nodeColumnInfo.pods.classes}
          columns={columns}
          columnID={nodeColumnInfo.pods.id}
        >
          {pods}
        </TableData>
        <TableData
          className={nodeColumnInfo.memory.classes}
          columns={columns}
          columnID={nodeColumnInfo.memory.id}
        >
          {memory}
        </TableData>
        <TableData
          className={nodeColumnInfo.cpu.classes}
          columns={columns}
          columnID={nodeColumnInfo.cpu.id}
        >
          {cores ? `${formatCores(cores)} cores` : '-'}
        </TableData>
        <TableData
          className={nodeColumnInfo.filesystem.classes}
          columns={columns}
          columnID={nodeColumnInfo.filesystem.id}
        >
          {storage}
        </TableData>
        <TableData
          className={nodeColumnInfo.created.classes}
          columns={columns}
          columnID={nodeColumnInfo.created.id}
        >
          <Timestamp timestamp={node.metadata.creationTimestamp} />
        </TableData>
        <TableData
          className={nodeColumnInfo.instanceType.classes}
          columns={columns}
          columnID={nodeColumnInfo.instanceType.id}
        >
          {instanceType || '-'}
        </TableData>
        <TableData
          className={nodeColumnInfo.machine.classes}
          columns={columns}
          columnID={nodeColumnInfo.machine.id}
        >
          {machine ? (
            <ResourceLink
              kind={referenceForModel(MachineModel)}
              name={machine.name}
              namespace={machine.namespace}
            />
          ) : (
            '-'
          )}
        </TableData>
        <TableData
          className={nodeColumnInfo.labels.classes}
          columns={columns}
          columnID={nodeColumnInfo.labels.id}
        >
          <LabelList kind={kind} labels={labels} />
        </TableData>
        <TableData
          className={nodeColumnInfo.zone.classes}
          columns={columns}
          columnID={nodeColumnInfo.zone.id}
        >
          {zone}
        </TableData>
        <TableData className={Kebab.columnClass}>
          <ResourceKebab
            actions={menuActions}
            kind={referenceForModel(NodeModel)}
            resource={node}
          />
        </TableData>
      </TableRow>
    );
  },
);
NodesTableRow.displayName = 'NodesTableRow';

type NodesTableRowProps = {
  obj: NodeKind;
  index: number;
  rowKey: string;
  style: object;
};

const NodesTable: React.FC<NodesTableProps> = React.memo((props) => {
  const Row = React.useCallback(
    (rowArgs: RowFunctionArgs<NodeKind>) => (
      <NodesTableRow
        obj={rowArgs.obj}
        index={rowArgs.index}
        rowKey={rowArgs.key}
        style={rowArgs.style}
      />
    ),
    [],
  );
  return (
    <Table
      {...props}
      columnManagementID={columnManagementID}
      aria-label="Nodes"
      Header={NodeTableHeader}
      Row={Row}
      virtualize
    />
  );
});

type NodesTableProps = React.ComponentProps<typeof Table> & {
  data: NodeKind[];
};

const filters = [
  {
    filterGroupName: 'Status',
    type: 'node-status',
    reducer: nodeStatus,
    items: [
      { id: 'Ready', title: 'Ready' },
      { id: 'Not Ready', title: 'Not Ready' },
    ],
  },
  {
    filterGroupName: 'Role',
    type: 'node-role',
    reducer: getNodeRole,
    items: [
      {
        id: 'master',
        title: 'Master',
      },
      {
        id: 'worker',
        title: 'Worker',
      },
    ],
  },
];

const fetchNodeMetrics = (): Promise<NodeMetrics> => {
  const metrics = [
    {
      key: 'usedMemory',
      query: 'sum by (instance) (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)',
    },
    {
      key: 'totalMemory',
      query: 'sum by (instance) (node_memory_MemTotal_bytes)',
    },
    {
      key: 'usedStorage',
      query: 'sum by (instance) (node_filesystem_size_bytes - node_filesystem_free_bytes)',
    },
    {
      key: 'totalStorage',
      query: 'sum by (instance) (node_filesystem_size_bytes)',
    },
    {
      key: 'cpu',
      query: 'sum by(instance) (instance:node_cpu:rate:sum)',
    },
    {
      key: 'pods',
      query: 'sum by(node)(kubelet_running_pod_count)',
    },
  ];
  const promises = metrics.map(({ key, query }) => {
    const url = getPrometheusURL({ endpoint: PrometheusEndpoint.QUERY, query });
    return coFetchJSON(url).then(({ data: { result } }) => {
      return result.reduce((acc, data) => {
        const value = Number(data.value[1]);
        return _.set(acc, [key, data.metric.instance || data.metric.node], value);
      }, {});
    });
  });
  return Promise.all(promises).then((data: any[]) => _.assign({}, ...data));
};

const mapDispatchToProps = (dispatch): MapDispatchToProps => ({
  setNodeMetrics: (metrics) => dispatch(setNodeMetrics(metrics)),
});

const showMetrics = PROMETHEUS_BASE_PATH && window.innerWidth > 1200;

const NodesPage = connect<{}, MapDispatchToProps>(
  null,
  mapDispatchToProps,
)((props: MapDispatchToProps) => {
  const { setNodeMetrics: setMetrics } = props;
  const selectedColumns: Set<string> = new Set(
    useSelector<RootState, string>(({ UI }) => UI.getIn(['columnManagement', columnManagementID])),
  );

  React.useEffect(() => {
    const updateMetrics = () =>
      fetchNodeMetrics()
        .then(setMetrics)
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('Error fetching node metrics: ', e);
        });
    updateMetrics();
    if (showMetrics) {
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ListPage
      {...props}
      kind={kind}
      ListComponent={NodesTable}
      rowFilters={filters}
      columnLayout={{
        columns: NodeTableHeader().map((column) => _.pick(column, ['title', 'additional', 'id'])),
        id: columnManagementID,
        selectedColumns,
        type: 'Node',
      }}
    />
  );
});

type MapDispatchToProps = {
  setNodeMetrics: (metrics) => void;
};

export default NodesPage;
