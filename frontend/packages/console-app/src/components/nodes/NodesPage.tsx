import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import { ListPageBody } from '@console/dynamic-plugin-sdk/src/api/dynamic-core-api';
import {
  NodeCertificateSigningRequestKind,
  RowFilter,
  RowProps,
  TableColumn,
  VirtualizedTableProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { NodeMetrics, setNodeMetrics } from '@console/internal/actions/ui';
import { coFetchJSON } from '@console/internal/co-fetch';
import { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import VirtualizedTable, {
  TableData,
} from '@console/internal/components/factory/Table/VirtualizedTable';
import { PROMETHEUS_BASE_PATH } from '@console/internal/components/graphs';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  Kebab,
  ResourceLink,
  Timestamp,
  humanizeBinaryBytes,
  formatCores,
  LabelList,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel, MachineModel } from '@console/internal/models';
import {
  NodeKind,
  referenceForModel,
  CertificateSigningRequestKind,
  referenceFor,
} from '@console/internal/module/k8s';
import {
  getName,
  getUID,
  getLabels,
  getNodeMachineNameAndNamespace,
  TableColumnsType,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  getNodeRoleMatch,
  getNodeRoles,
  useUserSettingsCompatibility,
  nodeUptime,
  nodeZone,
  nodeMachine,
  nodeInstanceType,
  nodeFS,
  nodeCPU,
  nodeMemory,
  nodePods,
  nodeReadiness,
  nodeRoles as nodeRolesSort,
  sortWithCSRResource,
  LazyActionMenu,
} from '@console/shared';
import { nodeStatus } from '../../status';
import { getNodeClientCSRs, isCSRResource } from './csr';
import NodeUptime from './node-dashboard/NodeUptime';
import NodeRoles from './NodeRoles';
import { NodeStatusWithExtensions } from './NodeStatus';
import ClientCSRStatus from './status/CSRStatus';
import { GetNodeStatusExtensions, useNodeStatusExtensions } from './useNodeStatusExtensions';

const nodeColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
  },
  status: {
    classes: '',
    id: 'status',
  },
  role: {
    classes: '',
    id: 'role',
  },
  pods: {
    classes: '',
    id: 'pods',
  },
  memory: {
    classes: '',
    id: 'memory',
  },
  cpu: {
    classes: '',
    id: 'cpu',
  },
  filesystem: {
    classes: '',
    id: 'filesystem',
  },
  created: {
    classes: '',
    id: 'created',
  },
  instanceType: {
    classes: '',
    id: 'instanceType',
  },
  machine: {
    classes: '',
    id: 'machine',
  },
  labels: {
    classes: '',
    id: 'labels',
  },
  zone: {
    classes: '',
    id: 'zone',
  },
  uptime: {
    classes: '',
    id: 'uptime',
  },
});

const columnManagementID = referenceForModel(NodeModel);
const kind = 'Node';

const getColumns = (t: TFunction): TableColumn<NodeRowItem>[] => [
  {
    title: t('console-app~Name'),
    id: nodeColumnInfo.name.id,
    sort: 'metadata.name',
    transforms: [sortable],
    props: { className: nodeColumnInfo.name.classes },
  },
  {
    title: t('console-app~Status'),
    id: nodeColumnInfo.status.id,
    sort: sortWithCSRResource(nodeReadiness, 'False'),
    transforms: [sortable],
    props: { className: nodeColumnInfo.status.classes },
  },
  {
    title: t('console-app~Roles'),
    id: nodeColumnInfo.role.id,
    sort: sortWithCSRResource(nodeRolesSort, ''),
    transforms: [sortable],
    props: { className: nodeColumnInfo.role.classes },
  },
  {
    title: t('console-app~Pods'),
    id: nodeColumnInfo.pods.id,
    sort: sortWithCSRResource(nodePods, 0),
    transforms: [sortable],
    props: { className: nodeColumnInfo.pods.classes },
  },
  {
    title: t('console-app~Memory'),
    id: nodeColumnInfo.memory.id,
    sort: sortWithCSRResource(nodeMemory, 0),
    transforms: [sortable],
    props: { className: nodeColumnInfo.memory.classes },
  },
  {
    title: t('console-app~CPU'),
    id: nodeColumnInfo.cpu.id,
    sort: sortWithCSRResource(nodeCPU, 0),
    transforms: [sortable],
    props: { className: nodeColumnInfo.cpu.classes },
  },
  {
    title: t('console-app~Filesystem'),
    id: nodeColumnInfo.filesystem.id,
    sort: sortWithCSRResource(nodeFS, 0),
    transforms: [sortable],
    props: { className: nodeColumnInfo.filesystem.classes },
  },
  {
    title: t('console-app~Created'),
    id: nodeColumnInfo.created.id,
    sort: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: nodeColumnInfo.created.classes },
  },
  {
    title: t('console-app~Instance type'),
    id: nodeColumnInfo.instanceType.id,
    sort: sortWithCSRResource(nodeInstanceType, ''),
    transforms: [sortable],
    props: { className: nodeColumnInfo.instanceType.classes },
  },
  {
    title: t('console-app~Machine'),
    id: nodeColumnInfo.machine.id,
    sort: sortWithCSRResource(nodeMachine, ''),
    transforms: [sortable],
    props: { className: nodeColumnInfo.machine.classes },
    additional: true,
  },
  {
    title: t('console-app~Labels'),
    id: nodeColumnInfo.labels.id,
    sort: 'metadata.labels',
    transforms: [sortable],
    props: { className: nodeColumnInfo.labels.classes },
    additional: true,
  },
  {
    title: t('console-app~Zone'),
    id: nodeColumnInfo.zone.id,
    sort: sortWithCSRResource(nodeZone, ''),
    transforms: [sortable],
    props: { className: nodeColumnInfo.zone.classes },
    additional: true,
  },
  {
    title: t('console-app~Uptime'),
    id: nodeColumnInfo.uptime.id,
    sort: sortWithCSRResource(nodeUptime, ''),
    transforms: [sortable],
    props: { className: nodeColumnInfo.uptime.classes },
    additional: true,
  },
  {
    title: '',
    id: '',
    props: { className: Kebab.columnClass },
  },
];

const NodesTableRow: React.FC<RowProps<NodeKind, GetNodeStatusExtensions>> = ({
  obj: node,
  activeColumnIDs,
  rowData,
}) => {
  const { t } = useTranslation();
  const metrics = useSelector(({ UI }) => UI.getIn(['metrics', 'node']));
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
      ? t('console-app~{{formattedCores}} cores / {{totalCores}} cores', {
          formattedCores: formatCores(cores),
          totalCores,
        })
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
  const resourceKind = referenceFor(node);
  const context = { [resourceKind]: node };
  return (
    <>
      <TableData
        className={nodeColumnInfo.name.classes}
        id={nodeColumnInfo.name.id}
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink
          groupVersionKind={{
            kind: NodeModel.kind,
            version: NodeModel.apiVersion,
          }}
          name={nodeName}
          title={nodeUID}
        />
      </TableData>
      <TableData
        className={nodeColumnInfo.status.classes}
        id={nodeColumnInfo.status.id}
        activeColumnIDs={activeColumnIDs}
      >
        <NodeStatusWithExtensions node={node} statusExtensions={rowData} />
      </TableData>
      <TableData
        className={nodeColumnInfo.role.classes}
        id={nodeColumnInfo.role.id}
        activeColumnIDs={activeColumnIDs}
      >
        <NodeRoles node={node} />
      </TableData>
      <TableData
        className={nodeColumnInfo.pods.classes}
        id={nodeColumnInfo.pods.id}
        activeColumnIDs={activeColumnIDs}
      >
        {pods}
      </TableData>
      <TableData
        className={nodeColumnInfo.memory.classes}
        id={nodeColumnInfo.memory.id}
        activeColumnIDs={activeColumnIDs}
      >
        {memory}
      </TableData>
      <TableData
        className={nodeColumnInfo.cpu.classes}
        id={nodeColumnInfo.cpu.id}
        activeColumnIDs={activeColumnIDs}
      >
        {cpu}
      </TableData>
      <TableData
        className={nodeColumnInfo.filesystem.classes}
        id={nodeColumnInfo.filesystem.id}
        activeColumnIDs={activeColumnIDs}
      >
        {storage}
      </TableData>
      <TableData
        className={nodeColumnInfo.created.classes}
        id={nodeColumnInfo.created.id}
        activeColumnIDs={activeColumnIDs}
      >
        <Timestamp timestamp={node.metadata.creationTimestamp} />
      </TableData>
      <TableData
        className={nodeColumnInfo.instanceType.classes}
        id={nodeColumnInfo.instanceType.id}
        activeColumnIDs={activeColumnIDs}
      >
        {instanceType || '-'}
      </TableData>
      <TableData
        className={nodeColumnInfo.machine.classes}
        id={nodeColumnInfo.machine.id}
        activeColumnIDs={activeColumnIDs}
      >
        {machine.name && machine.namespace ? (
          <ResourceLink
            groupVersionKind={{
              kind: MachineModel.kind,
              version: MachineModel.apiVersion,
              group: MachineModel.apiGroup,
            }}
            name={machine.name}
            namespace={machine.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData
        className={nodeColumnInfo.labels.classes}
        id={nodeColumnInfo.labels.id}
        activeColumnIDs={activeColumnIDs}
      >
        <LabelList kind={kind} labels={labels} />
      </TableData>
      <TableData
        className={nodeColumnInfo.zone.classes}
        id={nodeColumnInfo.zone.id}
        activeColumnIDs={activeColumnIDs}
      >
        {zone}
      </TableData>
      <TableData
        className={nodeColumnInfo.uptime.classes}
        id={nodeColumnInfo.uptime.id}
        activeColumnIDs={activeColumnIDs}
      >
        <NodeUptime obj={node} />
      </TableData>
      <TableData className={Kebab.columnClass} activeColumnIDs={activeColumnIDs} id="">
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

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

const showMetrics = PROMETHEUS_BASE_PATH && window.innerWidth > 1200;

const CSRTableRow: React.FC<RowProps<NodeCertificateSigningRequestKind>> = ({
  obj: csr,
  activeColumnIDs,
}) => {
  return (
    <>
      <TableData
        className={nodeColumnInfo.name.classes}
        id={nodeColumnInfo.name.id}
        activeColumnIDs={activeColumnIDs}
      >
        {csr.metadata.name}
      </TableData>
      <TableData
        className={nodeColumnInfo.status.classes}
        id={nodeColumnInfo.status.id}
        activeColumnIDs={activeColumnIDs}
      >
        <ClientCSRStatus
          csr={{ ...csr, metadata: { ...csr.metadata, name: csr.metadata.originalName } }}
          title="Discovered"
        />
      </TableData>
      <TableData
        className={nodeColumnInfo.role.classes}
        id={nodeColumnInfo.role.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.pods.classes}
        id={nodeColumnInfo.pods.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.memory.classes}
        id={nodeColumnInfo.memory.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.cpu.classes}
        id={nodeColumnInfo.cpu.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.filesystem.classes}
        id={nodeColumnInfo.filesystem.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.created.classes}
        id={nodeColumnInfo.created.id}
        activeColumnIDs={activeColumnIDs}
      >
        <Timestamp timestamp={csr.metadata.creationTimestamp} />
      </TableData>
      <TableData
        className={nodeColumnInfo.instanceType.classes}
        id={nodeColumnInfo.instanceType.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.machine.classes}
        id={nodeColumnInfo.machine.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.labels.classes}
        id={nodeColumnInfo.labels.id}
        activeColumnIDs={activeColumnIDs}
      >
        <LabelList kind={kind} labels={getLabels(csr)} />
      </TableData>
      <TableData
        className={nodeColumnInfo.zone.classes}
        id={nodeColumnInfo.zone.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData
        className={nodeColumnInfo.uptime.classes}
        id={nodeColumnInfo.uptime.id}
        activeColumnIDs={activeColumnIDs}
      >
        -
      </TableData>
      <TableData className={Kebab.columnClass} activeColumnIDs={activeColumnIDs} id="" />
    </>
  );
};

const TableRow: React.FC<RowProps<NodeRowItem, GetNodeStatusExtensions>> = ({ obj, ...rest }) =>
  isCSRResource(obj) ? <CSRTableRow obj={obj} {...rest} /> : <NodesTableRow obj={obj} {...rest} />;

type NodeListProps = Pick<
  VirtualizedTableProps<NodeRowItem>,
  'data' | 'unfilteredData' | 'loaded' | 'loadError'
>;

const NodeList: React.FC<NodeListProps> = (props) => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => getColumns(t), [t]);
  const [activeColumns, userSettingsLoaded] = useActiveColumns({
    columns,
    showNamespaceOverride: false,
    columnManagementID,
  });

  const statusExtensions = useNodeStatusExtensions();
  return (
    userSettingsLoaded && (
      <VirtualizedTable<NodeRowItem, GetNodeStatusExtensions>
        {...props}
        aria-label={t('public~Nodes')}
        label={t('public~Nodes')}
        columns={activeColumns}
        Row={TableRow}
        rowData={statusExtensions}
      />
    )
  );
};

type NodeRowItem = NodeKind | NodeCertificateSigningRequestKind;

const getFilters = (t: TFunction): RowFilter<NodeRowItem>[] => [
  {
    filterGroupName: t('console-app~Status'),
    type: 'node-status',
    reducer: (obj) => (isCSRResource(obj) ? 'Discovered' : nodeStatus(obj)),
    items: [
      { id: 'Ready', title: t('console-app~Ready') },
      { id: 'Not Ready', title: t('console-app~Not Ready') },
      { id: 'Discovered', title: t('console-app~Discovered') },
    ],
    filter: (input, obj) => {
      if (!input.selected?.length) {
        return true;
      }
      if (isCSRResource(obj)) {
        return input.selected?.includes('Discovered');
      }
      return input.selected?.includes(nodeStatus(obj));
    },
  },
  {
    filterGroupName: t('console-app~Roles'),
    type: 'node-role',
    isMatch: (obj, role) => (isCSRResource(obj) ? false : getNodeRoleMatch(obj, role)),
    items: [
      {
        id: 'control-plane',
        title: t('console-app~control-plane'),
      },
      {
        id: 'worker',
        title: t('console-app~worker'),
      },
    ],
    filter: (input, obj) => {
      if (!input.selected?.length) {
        return true;
      }
      if (isCSRResource(obj)) {
        return false;
      }
      const nodeRoles = getNodeRoles(obj);
      return input.selected?.some((r) => nodeRoles.includes(r));
    },
  },
];

const NodesPage = () => {
  const dispatch = useDispatch();

  const [selectedColumns, , userSettingsLoaded] = useUserSettingsCompatibility<TableColumnsType>(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );

  const [nodes, nodesLoaded, nodesLoadError] = useK8sWatchResource<NodeKind[]>({
    groupVersionKind: {
      kind: 'Node',
      version: 'v1',
    },
    isList: true,
  });

  const [csrs, csrsLoaded, csrsLoadError] = useK8sWatchResource<CertificateSigningRequestKind[]>({
    groupVersionKind: {
      group: 'certificates.k8s.io',
      kind: 'CertificateSigningRequest',
      version: 'v1',
    },
    isList: true,
  });

  React.useEffect(() => {
    const updateMetrics = async () => {
      try {
        const metrics = await fetchNodeMetrics();
        dispatch(setNodeMetrics(metrics));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error fetching node metrics: ', e);
      }
    };
    updateMetrics();
    if (showMetrics) {
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }
    return () => {};
  }, [dispatch]);
  const { t } = useTranslation();

  const data = React.useMemo(() => {
    const csrBundle = getNodeClientCSRs(csrs).filter(
      (csr) => !nodes.some((n) => n.metadata.name === csr.metadata.name),
    );
    return [...csrBundle, ...nodes];
  }, [csrs, nodes]);

  const filters = React.useMemo(() => getFilters(t), [t]);

  const [allData, filteredData, onFilterChange] = useListPageFilter(data, filters);

  const loaded = nodesLoaded && csrsLoaded;
  const loadError = nodesLoadError || csrsLoadError;

  const columns = React.useMemo(() => getColumns(t), [t]);

  return (
    userSettingsLoaded && (
      <>
        <ListPageHeader title={t('public~Nodes')} />
        <ListPageBody>
          <ListPageFilter
            data={allData}
            loaded={loaded}
            rowFilters={filters}
            onFilterChange={onFilterChange}
            columnLayout={{
              columns: columns.map((column) => _.pick(column, ['title', 'additional', 'id'])),
              id: columnManagementID,
              selectedColumns:
                selectedColumns?.[columnManagementID]?.length > 0
                  ? new Set(selectedColumns[columnManagementID])
                  : null,
              type: 'Node',
            }}
          />
          <NodeList
            data={filteredData}
            unfilteredData={allData}
            loaded={loaded}
            loadError={loadError}
          />
        </ListPageBody>
      </>
    )
  );
};

export default NodesPage;
