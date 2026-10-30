import type {
  PrometheusResponse,
  StatusGroup,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { PrometheusStatusGroupMapper } from '@console/dynamic-plugin-sdk/src/extensions/dashboards';
import { InventoryStatusGroup } from './status-group';

const selector = (namespace?: string) =>
  `job="kube-state-metrics"${namespace ? `,namespace=${JSON.stringify(namespace)}` : ''}`;

const withStatus = (expression: string, status: string) =>
  `label_replace((${expression}), "status", "${status}", "", "")`;

// Kubernetes namespace metrics distinguish missing data from a known-empty inventory.
// OpenShift exporters have no equivalent namespace metric, so empty count results mean zero.
const withZero = (expression: string, namespace?: string, job = 'kube-state-metrics') => {
  if (job !== 'kube-state-metrics') {
    return `(${expression}) or on () vector(0)`;
  }
  const labels = selector(namespace);
  return `(${expression}) or on () (0 * count(kube_namespace_status_phase{${labels}} == 1))`;
};

/** Counts distinct objects, so exporter replicas and informational labels cannot inflate totals. */
export const getInventoryCountQuery = (
  metric: string,
  identity: string,
  namespace?: string,
  job = 'kube-state-metrics',
) =>
  withZero(
    `count(count by (namespace, ${identity}) (${metric}{job="${job}"${
      namespace ? `,namespace=${JSON.stringify(namespace)}` : ''
    }}))`,
    namespace,
    job,
  );

// Data for this node proves the exporter is serving inventory metrics. Scrape port
// names vary between monitoring deployments, so do not infer health from an endpoint label.
const emptyNodeInventory = (nodeName: string) =>
  `0 * count(kube_node_info{job="kube-state-metrics",node=${JSON.stringify(nodeName)}})`;

/** Reads only the identities of pods assigned to this node, plus an exporter health fallback. */
export const getNodePodInventoryQuery = (nodeName: string): string =>
  `group by (uid) (kube_pod_info{job="kube-state-metrics",node=${JSON.stringify(nodeName)}})
   or on () (${emptyNodeInventory(nodeName)})`;

/** Selects one status per pod, ordered by terminating, crash loop, create error, then phase. */
export const getPodInventoryQuery = (
  namespace?: string,
  nodeName?: string,
  podUIDs?: string[],
): string => {
  if (nodeName && !podUIDs) return '';
  if (nodeName && podUIDs.length === 0) {
    return emptyNodeInventory(nodeName);
  }
  const uids = podUIDs ? [...new Set(podUIDs)].sort() : undefined;
  if (uids?.some((uid) => !/^[a-zA-Z0-9-]+$/.test(uid))) {
    throw new Error('Invalid pod UID in inventory metrics');
  }
  const uidSelector = uids ? `,uid=~${JSON.stringify(uids.join('|'))}` : '';
  const labels = selector(namespace) + uidSelector;
  const identity = 'namespace, pod, uid';
  const pods = `max by (${identity}) (kube_pod_info{${labels}${
    nodeName ? `,node=${JSON.stringify(nodeName)}` : ''
  }})`;
  // Each status metric is selected once. topk chooses exactly one status per pod.
  // The node join runs before topk, so it only ranks pods belonging to this node.
  const statuses = `
    label_replace(max by (${identity}, phase) (kube_pod_status_phase{${labels}} == 1), "status", "$1", "phase", "(.*)")
    or ${withStatus(`max by (${identity}) (kube_pod_container_status_waiting_reason{${labels},reason=~"CreateContainerError|CreateContainerConfigError"} == 1) * 2`, 'CreateContainerError')}
    or ${withStatus(
      `max by (${identity}) (
      (kube_pod_container_status_waiting_reason{${labels},reason="CrashLoopBackOff"} == 1)
      or (kube_pod_init_container_status_waiting_reason{${labels},reason="CrashLoopBackOff"} == 1)
    ) * 3`,
      'CrashLoopBackOff',
    )}
    or ${withStatus(`max by (${identity}) ((kube_pod_deletion_timestamp{${labels}} > 0) * 0 + 4)`, 'Terminating')}
    or ${withStatus(`0 * (${pods})`, 'Unknown')}
  `;
  return withZero(
    `count by (status) (topk by (${identity}) (1, (${statuses}) and on (${identity}) (${pods})))`,
    namespace,
  );
};

export const getNodeInventoryQuery = (): string =>
  withZero(`count by (status) (
    ${withStatus('max by (node) (kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 1)', 'Ready')}
    or ${withStatus(
      'max by (node) (kube_node_info{job="kube-state-metrics"}) unless on (node) (kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 1)',
      'Not Ready',
    )}
  )`);

export const getPVCInventoryQuery = (namespace?: string): string => {
  const identity = 'namespace, persistentvolumeclaim';
  const claims = `max by (${identity}) (kube_persistentvolumeclaim_info{${selector(namespace)}})`;
  const phase = `max by (${identity}, phase) (kube_persistentvolumeclaim_status_phase{${selector(namespace)}} == 1)`;
  return withZero(
    `count by (status) (topk by (${identity}) (1, ((
      label_replace((${phase}), "status", "$1", "phase", "(.*)")
      or ${withStatus(`(${claims}) unless on (${identity}) (${phase})`, 'Unknown')}
    ) and on (${identity}) (${claims}))))`,
    namespace,
  );
};

const mapGroups = (
  response: PrometheusResponse,
  mapping: Partial<Record<InventoryStatusGroup, string[]>>,
): StatusGroup => {
  if (response.data.result.length === 0) {
    throw new Error('Inventory metrics are unavailable');
  }
  const groups: StatusGroup = {
    [InventoryStatusGroup.UNKNOWN]: { count: 0, statusIDs: [] },
  };
  Object.entries(mapping).forEach(([id, statusIDs]) => {
    groups[id] = { count: 0, statusIDs, filterType: 'status' };
  });
  response.data.result.forEach(({ metric, value }) => {
    const count = Number(value?.[1]);
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('Invalid inventory count');
    }
    const group =
      Object.keys(mapping).find((id) => mapping[id].includes(metric.status)) ||
      InventoryStatusGroup.UNKNOWN;
    groups[group].count += count;
  });
  return groups;
};

/** Converts a query containing only the total count into a healthy inventory group. */
export const getPrometheusInventoryCount: PrometheusStatusGroupMapper = (response) => {
  const groups = mapGroups(response, {});
  return { [InventoryStatusGroup.NOT_MAPPED]: groups[InventoryStatusGroup.UNKNOWN] };
};

export const getPrometheusPodStatusGroups: PrometheusStatusGroupMapper = (response) =>
  mapGroups(response, {
    [InventoryStatusGroup.NOT_MAPPED]: ['Running', 'Succeeded'],
    [InventoryStatusGroup.ERROR]: ['CrashLoopBackOff', 'CreateContainerError', 'Failed'],
    [InventoryStatusGroup.PROGRESS]: ['Terminating', 'Pending'],
    [InventoryStatusGroup.WARN]: ['Unknown'],
  });

export const getPrometheusNodeStatusGroups: PrometheusStatusGroupMapper = (response) =>
  mapGroups(response, {
    [InventoryStatusGroup.NOT_MAPPED]: ['Ready'],
    [InventoryStatusGroup.PROGRESS]: ['Not Ready'],
  });

export const getPrometheusPVCStatusGroups: PrometheusStatusGroupMapper = (response) =>
  mapGroups(response, {
    [InventoryStatusGroup.NOT_MAPPED]: ['Bound'],
    [InventoryStatusGroup.ERROR]: ['Lost'],
    [InventoryStatusGroup.PROGRESS]: ['Pending'],
  });
