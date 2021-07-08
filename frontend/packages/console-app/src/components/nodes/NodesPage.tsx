import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { NodeMetrics, setNodeMetrics } from '@console/internal/actions/ui';
import { coFetchJSON } from '@console/internal/co-fetch';
import {
  Table,
  TableRow,
  TableData,
  ListPage,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { PROMETHEUS_BASE_PATH } from '@console/internal/components/graphs';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  Timestamp,
  humanizeBinaryBytes,
  formatCores,
  LabelList,
} from '@console/internal/components/utils';
import { NodeModel, MachineModel } from '@console/internal/models';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import {
  getName,
  getUID,
  getNodeRole,
  getLabels,
  getNodeMachineNameAndNamespace,
  WithUserSettingsCompatibilityProps,
  TableColumnsType,
  withUserSettingsCompatibility,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
} from '@console/shared';
import { nodeStatus } from '../../status/node';
import { menuActions } from './menu-actions';
import NodeRoles from './NodeRoles';
import NodeStatus from './NodeStatus';
import MarkAsSchedulablePopover from './popovers/MarkAsSchedulablePopover';

// t('console-app~Name')
// t('console-app~Status')
// t('console-app~Role')
// t('console-app~Pods')
// t('console-app~Memory')
// t('console-app~CPU')
// t('console-app~Filesystem')
// t('console-app~Created')
// t('console-app~Instance type')
// t('console-app~Machine')
// t('console-app~Labels')
// t('console-app~Zone')

const nodeColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
    title: 'console-app~Name',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'console-app~Status',
  },
  role: {
    classes: '',
    id: 'role',
    title: 'console-app~Role',
  },
  pods: {
    classes: '',
    id: 'pods',
    title: 'console-app~Pods',
  },
  memory: {
    classes: '',
    id: 'memory',
    title: 'console-app~Memory',
  },
  cpu: {
    classes: '',
    id: 'cpu',
    title: 'console-app~CPU',
  },
  filesystem: {
    classes: '',
    id: 'filesystem',
    title: 'console-app~Filesystem',
  },
  created: {
    classes: '',
    id: 'created',
    title: 'console-app~Created',
  },
  instanceType: {
    classes: '',
    id: 'instanceType',
    title: 'console-app~Instance type',
  },
  machine: {
    classes: '',
    id: 'machine',
    title: 'console-app~Machine',
  },
  labels: {
    classes: '',
    id: 'labels',
    title: 'console-app~Labels',
  },
  zone: {
    classes: '',
    id: 'zone',
    title: 'console-app~Zone',
  },
});

const columnManagementID = referenceForModel(NodeModel);
const kind = 'Node';

const NodeTableHeader = () => {
  return [
    {
      title: i18next.t(nodeColumnInfo.name.title),
      id: nodeColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: nodeColumnInfo.name.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.status.title),
      id: nodeColumnInfo.status.id,
      sortFunc: 'nodeReadiness',
      transforms: [sortable],
      props: { className: nodeColumnInfo.status.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.role.title),
      id: nodeColumnInfo.role.id,
      sortFunc: 'nodeRoles',
      transforms: [sortable],
      props: { className: nodeColumnInfo.role.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.pods.title),
      id: nodeColumnInfo.pods.id,
      sortFunc: 'nodePods',
      transforms: [sortable],
      props: { className: nodeColumnInfo.pods.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.memory.title),
      id: nodeColumnInfo.memory.id,
      sortFunc: 'nodeMemory',
      transforms: [sortable],
      props: { className: nodeColumnInfo.memory.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.cpu.title),
      id: nodeColumnInfo.cpu.id,
      sortFunc: 'nodeCPU',
      transforms: [sortable],
      props: { className: nodeColumnInfo.cpu.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.filesystem.title),
      id: nodeColumnInfo.filesystem.id,
      sortFunc: 'nodeFS',
      transforms: [sortable],
      props: { className: nodeColumnInfo.filesystem.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.created.title),
      id: nodeColumnInfo.created.id,
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: nodeColumnInfo.created.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.instanceType.title),
      id: nodeColumnInfo.instanceType.id,
      sortFunc: 'nodeInstanceType',
      transforms: [sortable],
      props: { className: nodeColumnInfo.instanceType.classes },
    },
    {
      title: i18next.t(nodeColumnInfo.machine.title),
      id: nodeColumnInfo.machine.id,
      sortFunc: 'nodeMachine',
      transforms: [sortable],
      props: { className: nodeColumnInfo.machine.classes },
      additional: true,
    },
    {
      title: i18next.t(nodeColumnInfo.labels.title),
      id: nodeColumnInfo.labels.id,
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: nodeColumnInfo.labels.classes },
      additional: true,
    },
    {
      title: i18next.t(nodeColumnInfo.zone.title),
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
});

type NodesRowMapFromStateProps = {
  metrics: NodeMetrics;
};

const NodesTableRow = connect<NodesRowMapFromStateProps, null, NodesTableRowProps>(mapStateToProps)(
  ({
    obj: node,
    index,
    rowKey,
    style,
    metrics,
    tableColumns,
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
    const totalCores = metrics?.totalCPU?.[nodeName];
    const cpu =
      Number.isFinite(cores) && Number.isFinite(totalCores)
        ? `${formatCores(cores)} cores / ${totalCores} cores`
        : '-';
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
    const columns: Set<string> =
      tableColumns?.length > 0 ? new Set(tableColumns) : getSelectedColumns();
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
          {!node.spec.unschedulable ? (
            <NodeStatus node={node} showPopovers />
          ) : (
            <MarkAsSchedulablePopover node={node} />
          )}
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
          {cpu}
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
  tableColumns: string[];
};

const NodesTable: React.FC<NodesTableProps &
  WithUserSettingsCompatibilityProps<TableColumnsType>> = React.memo(
  ({ userSettingState: tableColumns, ...props }) => {
    const Row = React.useCallback(
      (rowArgs: RowFunctionArgs<NodeKind>) => (
        <NodesTableRow
          obj={rowArgs.obj}
          index={rowArgs.index}
          rowKey={rowArgs.key}
          style={rowArgs.style}
          tableColumns={rowArgs.customData?.tableColumns}
        />
      ),
      [],
    );
    const { t } = useTranslation();
    const selectedColumns: Set<string> =
      tableColumns?.[columnManagementID]?.length > 0
        ? new Set(tableColumns[columnManagementID])
        : null;
    return (
      <Table
        {...props}
        activeColumns={selectedColumns}
        columnManagementID={columnManagementID}
        aria-label={t('console-app~Nodes')}
        showNamespaceOverride
        Header={NodeTableHeader}
        Row={Row}
        customData={{ tableColumns: tableColumns?.[columnManagementID] }}
        virtualize
      />
    );
  },
);

type NodesTableProps = React.ComponentProps<typeof Table> & {
  data: NodeKind[];
};

const NodesTableWithUserSettings = withUserSettingsCompatibility<
  NodesTableProps & WithUserSettingsCompatibilityProps<TableColumnsType>,
  TableColumnsType
>(
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  undefined,
  true,
)(NodesTable);

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
      query:
        'sum by (instance) ((max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"})) - (max by (device, instance) (node_filesystem_free_bytes{device=~"/.*"})))',
    },
    {
      key: 'totalStorage',
      query:
        'sum by (instance) (max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"}))',
    },
    {
      key: 'cpu',
      query: 'sum by(instance) (instance:node_cpu:rate:sum)',
    },
    {
      key: 'totalCPU',
      query: 'sum by(instance) (instance:node_num_cpu:sum)',
    },
    {
      key: 'pods',
      query: 'sum by(node)(kubelet_running_pods)',
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
)(
  withUserSettingsCompatibility<
    MapDispatchToProps & WithUserSettingsCompatibilityProps<TableColumnsType>,
    TableColumnsType
  >(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  )((props: MapDispatchToProps & WithUserSettingsCompatibilityProps<TableColumnsType>) => {
    const { setNodeMetrics: setMetrics, userSettingState: tableColumns } = props;

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
    const { t } = useTranslation();
    const filters = [
      {
        filterGroupName: t('console-app~Status'),
        type: 'node-status',
        reducer: nodeStatus,
        items: [
          { id: 'Ready', title: t('console-app~Ready') },
          { id: 'Not Ready', title: t('console-app~Not Ready') },
        ],
      },
      {
        filterGroupName: t('console-app~Role'),
        type: 'node-role',
        reducer: getNodeRole,
        items: [
          {
            id: 'master',
            title: t('console-app~Master'),
          },
          {
            id: 'worker',
            title: t('console-app~Worker'),
          },
        ],
      },
    ];

    return (
      <ListPage
        {...props}
        kind={kind}
        ListComponent={NodesTableWithUserSettings}
        rowFilters={filters}
        columnLayout={{
          columns: NodeTableHeader().map((column) => _.pick(column, ['title', 'additional', 'id'])),
          id: columnManagementID,
          selectedColumns:
            tableColumns?.[columnManagementID]?.length > 0
              ? new Set(tableColumns[columnManagementID])
              : null,
          type: 'Node',
        }}
      />
    );
  }),
);

type MapDispatchToProps = {
  setNodeMetrics: (metrics) => void;
};

export default NodesPage;
