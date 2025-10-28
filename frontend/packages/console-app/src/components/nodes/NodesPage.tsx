import * as React from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  ResourceFilters,
} from '@console/app/src/components/data-view/types';
import {
  ListPageBody,
  useAccessReview,
} from '@console/dynamic-plugin-sdk/src/api/dynamic-core-api';
import {
  NodeCertificateSigningRequestKind,
  RowProps,
  TableColumn,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { NodeMetrics, setNodeMetrics } from '@console/internal/actions/ui';
import { coFetchJSON } from '@console/internal/co-fetch';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import { PROMETHEUS_BASE_PATH } from '@console/internal/components/graphs';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  ResourceLink,
  humanizeBinaryBytes,
  formatCores,
  LabelList,
  LoadingBox,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel, MachineModel } from '@console/internal/models';
import {
  NodeKind,
  referenceForModel,
  CertificateSigningRequestKind,
  referenceFor,
  Selector,
} from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  getName,
  getUID,
  getLabels,
  getNodeMachineNameAndNamespace,
  TableColumnsType,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  getNodeArchitecture,
  getNodeRoles,
  useUserSettingsCompatibility,
  nodeUptime,
  nodeZone,
  nodeMachine,
  nodeInstanceType,
  nodeFS,
  nodeCPU,
  nodeArch,
  nodeMemory,
  nodePods,
  nodeReadiness,
  nodeRoles as nodeRolesSort,
  sortWithCSRResource,
  LazyActionMenu,
  DASH,
} from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { nodeStatus } from '../../status';
import { getNodeClientCSRs, isCSRResource } from './csr';
import NodeUptime from './node-dashboard/NodeUptime';
import NodeRoles from './NodeRoles';
import { NodeStatusWithExtensions } from './NodeStatus';
import ClientCSRStatus from './status/CSRStatus';
import { GetNodeStatusExtensions, useNodeStatusExtensions } from './useNodeStatusExtensions';

const nodeColumnInfo = Object.freeze({
  name: {
    id: 'name',
  },
  status: {
    id: 'status',
  },
  role: {
    id: 'role',
  },
  pods: {
    id: 'pods',
  },
  memory: {
    id: 'memory',
  },
  cpu: {
    id: 'cpu',
  },
  architecture: {
    id: 'architecture',
  },
  filesystem: {
    id: 'filesystem',
  },
  created: {
    id: 'created',
  },
  instanceType: {
    id: 'instanceType',
  },
  machine: {
    id: 'machine',
  },
  labels: {
    id: 'labels',
  },
  zone: {
    id: 'zone',
  },
  uptime: {
    id: 'uptime',
  },
  actions: {
    id: '',
  },
});

const kind = 'Node';

const useNodesColumns = (): TableColumn<NodeRowItem>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('console-app~Name'),
        id: nodeColumnInfo.name.id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Status'),
        id: nodeColumnInfo.status.id,
        sort: sortWithCSRResource(nodeReadiness, 'False'),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Roles'),
        id: nodeColumnInfo.role.id,
        sort: sortWithCSRResource(nodeRolesSort, ''),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Pods'),
        id: nodeColumnInfo.pods.id,
        sort: sortWithCSRResource(nodePods, 0),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Memory'),
        id: nodeColumnInfo.memory.id,
        sort: sortWithCSRResource(nodeMemory, 0),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~CPU'),
        id: nodeColumnInfo.cpu.id,
        sort: sortWithCSRResource(nodeCPU, 0),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Architecture'),
        id: nodeColumnInfo.architecture.id,
        sort: sortWithCSRResource(nodeArch, ''),
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('console-app~Filesystem'),
        id: nodeColumnInfo.filesystem.id,
        sort: sortWithCSRResource(nodeFS, 0),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Created'),
        id: nodeColumnInfo.created.id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Instance type'),
        id: nodeColumnInfo.instanceType.id,
        sort: sortWithCSRResource(nodeInstanceType, ''),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Machine'),
        id: nodeColumnInfo.machine.id,
        sort: sortWithCSRResource(nodeMachine, ''),
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('console-app~Labels'),
        id: nodeColumnInfo.labels.id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('console-app~Zone'),
        id: nodeColumnInfo.zone.id,
        sort: sortWithCSRResource(nodeZone, ''),
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('console-app~Uptime'),
        id: nodeColumnInfo.uptime.id,
        sort: sortWithCSRResource(nodeUptime, ''),
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: '',
        id: nodeColumnInfo.actions.id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const CPUCell: React.FC<{ cores: number; totalCores: number }> = ({ cores, totalCores }) => {
  const { t } = useTranslation();
  return Number.isFinite(cores) && Number.isFinite(totalCores) ? (
    t('console-app~{{formattedCores}} cores / {{totalCores}} cores', {
      formattedCores: formatCores(cores),
      totalCores,
    })
  ) : (
    <>{DASH}</>
  );
};

const getNodeDataViewRows = (
  rowData: RowProps<NodeRowItem, GetNodeStatusExtensions>[],
  tableColumns: ConsoleDataViewColumn<NodeRowItem>[],
  nodeMetrics: NodeMetrics,
  statusExtensions: GetNodeStatusExtensions,
): ConsoleDataViewRow[] => {
  return rowData.map(({ obj }) => {
    const isCSR = isCSRResource(obj);
    const node = isCSR ? null : (obj as NodeKind);
    const csr = isCSR ? (obj as NodeCertificateSigningRequestKind) : null;

    const nodeName = node ? getName(node) : csr?.metadata.name || '';
    const nodeUID = node ? getUID(node) : '';
    const usedMem = nodeMetrics?.usedMemory?.[nodeName];
    const totalMem = nodeMetrics?.totalMemory?.[nodeName];
    const memory =
      Number.isFinite(usedMem) && Number.isFinite(totalMem)
        ? `${humanizeBinaryBytes(usedMem).string} / ${humanizeBinaryBytes(totalMem).string}`
        : DASH;
    const cores = nodeMetrics?.cpu?.[nodeName];
    const totalCores = nodeMetrics?.totalCPU?.[nodeName];
    const usedStrg = nodeMetrics?.usedStorage?.[nodeName];
    const totalStrg = nodeMetrics?.totalStorage?.[nodeName];
    const storage =
      Number.isFinite(usedStrg) && Number.isFinite(totalStrg)
        ? `${humanizeBinaryBytes(usedStrg).string} / ${humanizeBinaryBytes(totalStrg).string}`
        : DASH;
    const pods = nodeMetrics?.pods?.[nodeName] ?? DASH;
    const architecture = node ? getNodeArchitecture(node) : '';
    const [machineName, machineNamespace] = node ? getNodeMachineNameAndNamespace(node) : ['', ''];
    const instanceType = node?.metadata.labels?.['beta.kubernetes.io/instance-type'] || '';
    const labels = node ? getLabels(node) : csr ? getLabels(csr) : {};
    const zone = node?.metadata.labels?.['topology.kubernetes.io/zone'] || '';
    const resourceKind = node ? referenceFor(node) : '';
    const context = node ? { [resourceKind]: node } : {};

    const rowCells = {
      [nodeColumnInfo.name.id]: {
        cell: node ? (
          <ResourceLink
            groupVersionKind={{
              kind: NodeModel.kind,
              version: NodeModel.apiVersion,
            }}
            name={nodeName}
            title={nodeUID}
          />
        ) : (
          csr?.metadata.name || DASH
        ),
        props: getNameCellProps(nodeName),
      },
      [nodeColumnInfo.status.id]: {
        cell: node ? (
          <NodeStatusWithExtensions node={node} statusExtensions={statusExtensions} />
        ) : (
          <ClientCSRStatus
            csr={{ ...csr, metadata: { ...csr.metadata, name: csr.metadata.originalName } }}
            title="Discovered"
          />
        ),
      },
      [nodeColumnInfo.role.id]: {
        cell: node ? <NodeRoles node={node} /> : DASH,
      },
      [nodeColumnInfo.pods.id]: {
        cell: pods,
      },
      [nodeColumnInfo.memory.id]: {
        cell: memory,
      },
      [nodeColumnInfo.cpu.id]: {
        cell: <CPUCell cores={cores} totalCores={totalCores} />,
      },
      [nodeColumnInfo.architecture.id]: {
        cell: architecture,
      },
      [nodeColumnInfo.filesystem.id]: {
        cell: storage,
      },
      [nodeColumnInfo.created.id]: {
        cell: (
          <Timestamp
            timestamp={node?.metadata.creationTimestamp || csr?.metadata.creationTimestamp}
          />
        ),
      },
      [nodeColumnInfo.instanceType.id]: {
        cell: instanceType || DASH,
      },
      [nodeColumnInfo.machine.id]: {
        cell:
          machineName && machineNamespace ? (
            <ResourceLink
              groupVersionKind={{
                kind: MachineModel.kind,
                version: MachineModel.apiVersion,
                group: MachineModel.apiGroup,
              }}
              name={machineName}
              namespace={machineNamespace}
            />
          ) : (
            DASH
          ),
      },
      [nodeColumnInfo.labels.id]: {
        cell: <LabelList kind={kind} labels={labels} />,
        props: {
          width: 15,
        },
      },
      [nodeColumnInfo.zone.id]: {
        cell: zone,
      },
      [nodeColumnInfo.uptime.id]: {
        cell: node ? <NodeUptime obj={node} /> : DASH,
      },
      [nodeColumnInfo.actions.id]: {
        cell: node ? <LazyActionMenu context={context} /> : null,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
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
        'sum by (instance) ((max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"})) - (max by (device, instance) (node_filesystem_free_bytes{device=~"/.*"}))) or ' +
        'sum by (instance) ((max by (volume, instance) (windows_logical_disk_size_bytes)) - (max by (volume, instance) (windows_logical_disk_free_bytes)))',
    },
    {
      key: 'totalStorage',
      query:
        'sum by (instance) (max by (device, instance) (node_filesystem_size_bytes{device=~"/.*"})) or ' +
        'sum by (instance) (max by (volume, instance) (windows_logical_disk_size_bytes))',
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

type NodeListProps = {
  data: NodeRowItem[];
  loaded: boolean;
  loadError?: unknown;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
  selectedColumns?: TableColumnsType;
};

const NodeList: React.FC<NodeListProps> = ({
  data,
  loaded,
  loadError,
  hideNameLabelFilters,
  hideLabelFilter,
  hideColumnManagement,
  selectedColumns,
}) => {
  const { t } = useTranslation();
  const columns = useNodesColumns();
  const nodeMetrics = useSelector<RootState, NodeMetrics>(({ UI }) => {
    return UI.getIn(['metrics', 'node']);
  });
  const columnManagementID = referenceForModel(NodeModel);
  const statusExtensions = useNodeStatusExtensions();

  const columnLayout = React.useMemo(
    () => ({
      id: columnManagementID,
      type: t('console-app~Node'),
      columns: columns.map((col) => ({
        id: col.id,
        title: col.title,
        additional: col.additional,
      })),
      selectedColumns:
        selectedColumns?.[columnManagementID]?.length > 0
          ? new Set(selectedColumns[columnManagementID] as string[])
          : new Set<string>(),
    }),
    [columns, columnManagementID, selectedColumns, t],
  );

  const nodeStatusFilterOptions = React.useMemo<DataViewFilterOption[]>(
    () => [
      {
        value: 'Ready',
        label: t('console-app~Ready'),
      },
      {
        value: 'Not Ready',
        label: t('console-app~Not Ready'),
      },
      {
        value: 'Discovered',
        label: t('console-app~Discovered'),
      },
    ],
    [t],
  );

  const nodeRoleFilterOptions = React.useMemo<DataViewFilterOption[]>(
    () => [
      {
        value: 'control-plane',
        label: t('console-app~control-plane'),
      },
      {
        value: 'worker',
        label: t('console-app~worker'),
      },
    ],
    [t],
  );

  const nodeArchitectureFilterOptions = React.useMemo<DataViewFilterOption[]>(
    () => [
      { value: 'amd64', label: 'amd64' },
      { value: 'ppc64le', label: 'ppc64le' },
      { value: 'arm64', label: 'arm64' },
      { value: 's390x', label: 's390x' },
    ],
    [],
  );

  // Create stable filter nodes with stable option references to prevent filter resets
  const additionalFilterNodes = React.useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('console-app~Status')}
        placeholder={t('console-app~Filter by status')}
        options={nodeStatusFilterOptions}
      />,
      <DataViewCheckboxFilter
        key="roles"
        filterId="roles"
        title={t('console-app~Roles')}
        placeholder={t('console-app~Filter by roles')}
        options={nodeRoleFilterOptions}
      />,
      <DataViewCheckboxFilter
        key="architecture"
        filterId="architecture"
        title={t('console-app~Architecture')}
        placeholder={t('console-app~Filter by architecture')}
        options={nodeArchitectureFilterOptions}
      />,
    ],
    [t, nodeStatusFilterOptions, nodeRoleFilterOptions, nodeArchitectureFilterOptions],
  );

  const matchesAdditionalFilters = React.useCallback(
    (resource: NodeRowItem, filters: NodeFilters) => {
      const isCSR = isCSRResource(resource);

      // Status filter
      if (filters.status.length > 0) {
        const status = isCSR ? 'Discovered' : nodeStatus(resource as NodeKind);
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      // Roles filter
      if (filters.roles.length > 0) {
        if (isCSR) {
          return false;
        }
        const nodeRoles = getNodeRoles(resource as NodeKind);
        if (!filters.roles.some((r) => nodeRoles.includes(r))) {
          return false;
        }
      }

      // Architecture filter
      if (filters.architecture.length > 0) {
        if (isCSR) {
          return false;
        }
        const arch = getNodeArchitecture(resource as NodeKind);
        if (!filters.architecture.includes(arch)) {
          return false;
        }
      }

      return true;
    },
    [],
  );

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<NodeRowItem, NodeFilters>
        label={NodeModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={columnManagementID}
        initialFilters={
          { ...initialFiltersDefault, status: [], roles: [], architecture: [] } as NodeFilters
        }
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={(rowData, tableColumns) =>
          getNodeDataViewRows(
            (rowData as unknown) as RowProps<NodeRowItem, GetNodeStatusExtensions>[],
            tableColumns,
            nodeMetrics,
            statusExtensions,
          )
        }
        hideNameLabelFilters={hideNameLabelFilters}
        hideLabelFilter={hideLabelFilter}
        hideColumnManagement={hideColumnManagement}
      />
    </React.Suspense>
  );
};

type NodeRowItem = NodeKind | NodeCertificateSigningRequestKind;

interface NodeFilters extends ResourceFilters {
  status: string[];
  roles: string[];
  architecture: string[];
}

const useWatchCSRs = (): [CertificateSigningRequestKind[], boolean, unknown] => {
  const [isAllowed, checkIsLoading] = useAccessReview({
    group: 'certificates.k8s.io',
    resource: 'CertificateSigningRequest',
    verb: 'list',
  });

  const [csrs, loaded, error] = useK8sWatchResource<CertificateSigningRequestKind[]>(
    isAllowed
      ? {
          groupVersionKind: {
            group: 'certificates.k8s.io',
            kind: 'CertificateSigningRequest',
            version: 'v1',
          },
          isList: true,
        }
      : undefined,
  );

  return [csrs, !checkIsLoading && loaded, error];
};

const NodesPage: React.FC<NodesPageProps> = ({ selector }) => {
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
    selector,
  });

  const [csrs, csrsLoaded, csrsLoadError] = useWatchCSRs();

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

  const loaded = nodesLoaded && csrsLoaded;
  const loadError = nodesLoadError || csrsLoadError;

  if (!userSettingsLoaded) {
    return null;
  }

  return (
    <>
      <ListPageHeader title={t('public~Nodes')} />
      <ListPageBody>
        <NodeList
          data={data}
          loaded={loaded}
          loadError={loadError}
          selectedColumns={selectedColumns}
        />
      </ListPageBody>
    </>
  );
};

type NodesPageProps = {
  selector?: Selector;
};

export default NodesPage;
