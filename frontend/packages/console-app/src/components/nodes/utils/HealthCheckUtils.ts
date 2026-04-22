import type { TFunction } from 'i18next';
import type {
  K8sResourceKind,
  WatchK8sResource,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src';
import type { K8sModel, Selector } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { selectorToString, toRequirements } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MachineHealthCheckModel } from '@console/internal/models';
import type {
  MachineHealthCheckKind,
  MachineHealthCondition,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s/label-selector';
import { DASH } from '@console/shared/src';
import { formatDurationForDisplay } from './utils';

export type NodeHealthCheckUnhealthyCondition = {
  type: string;
  status: string;
  duration?: string;
};

export type NodeHealthCheckRemediationEntry = {
  started?: string;
  timedOut?: string;
  resource?: {
    name?: string;
    namespace?: string;
    kind?: string;
    apiVersion?: string;
  };
  templateName?: string;
};

export type NodeHealthCheckUnhealthyNodeEntry = {
  name: string;
  remediations?: NodeHealthCheckRemediationEntry[];
  conditionsHealthyTimestamp?: string;
  healthyDelayed?: boolean;
};

export type NodeHealthCheckKind = K8sResourceCommon & {
  spec?: {
    selector?: Selector;
    unhealthyConditions?: NodeHealthCheckUnhealthyCondition[];
  };
  status?: {
    unhealthyNodes?: NodeHealthCheckUnhealthyNodeEntry[];
    lastUpdateTime?: string;
    phase?: string;
    reason?: string;
    observedNodes?: number;
    healthyNodes?: number;
  };
};

export const NodeHealthCheckModel: K8sModel = {
  // t('console-app~NodeHealthCheck')
  label: 'NodeHealthCheck',
  // t('console-app~NodeHealthChecks')
  labelPlural: 'NodeHealthChecks',
  apiVersion: 'v1alpha1',
  apiGroup: 'remediation.medik8s.io',
  plural: 'nodehealthchecks',
  abbr: 'NHC',
  namespaced: false,
  kind: 'NodeHealthCheck',
  id: 'nodehealthcheck',
  crd: true,
};

export const CLUSTER_API_MACHINE_SET = 'machine.openshift.io/cluster-api-machineset';
export const CLUSTER_API_MACHINE_ROLE = 'machine.openshift.io/cluster-api-machine-role';
export const NODE_ROLE_PREFIX = 'node-role.kubernetes.io/';

export const nodeHealthChecksWatchResource: WatchK8sResource = {
  groupVersionKind: {
    group: NodeHealthCheckModel.apiGroup,
    version: NodeHealthCheckModel.apiVersion,
    kind: NodeHealthCheckModel.kind,
  },
  isList: true,
};

export const useWatchMachineHealthChecks = (): WatchK8sResult<MachineHealthCheckKind[]> =>
  useK8sWatchResource<MachineHealthCheckKind[]>({
    isList: true,
    kind: referenceForModel(MachineHealthCheckModel),
  });

export const useWatchNodeHealthChecks = (): WatchK8sResult<NodeHealthCheckKind[]> =>
  useK8sWatchResource<NodeHealthCheckKind[]>(nodeHealthChecksWatchResource);

export const isHealthCheckSelectorEmpty = (selector: Selector | undefined): boolean =>
  new LabelSelector(selector ?? {}).isEmpty();

export const getValuesForKey = (reqs: ReturnType<typeof toRequirements>, key: string): string[] =>
  reqs
    .filter(
      (r) =>
        r.key === key &&
        (r.operator === 'Equals' ||
          r.operator === 'In' ||
          r.operator === 'in' ||
          r.operator === 'Exists'),
    )
    .flatMap((r) => r.values ?? []);

export const getMachineHealthCheckScope = (
  selector: Selector | undefined,
  t: TFunction,
): string => {
  if (isHealthCheckSelectorEmpty(selector)) {
    return t('console-app~All machines');
  }
  const reqs = toRequirements(selector ?? {});
  const machineSetNames = getValuesForKey(reqs, CLUSTER_API_MACHINE_SET);
  if (machineSetNames.length) {
    return t('console-app~MachineSet {{name}}', { name: machineSetNames.join(', ') });
  }
  const machineRoles = getValuesForKey(reqs, CLUSTER_API_MACHINE_ROLE);
  if (machineRoles.length) {
    return t('console-app~Machine role {{role}}', { role: machineRoles.join(', ') });
  }
  return t('console-app~Selected machines');
};

export const getNodeHealthCheckScope = (selector: Selector | undefined, t: TFunction): string => {
  if (isHealthCheckSelectorEmpty(selector)) {
    return t('console-app~Cluster-wide');
  }
  const reqs = toRequirements(selector ?? {});
  const nodeRoles = new Set<string>();
  reqs.forEach((r) => {
    if (
      r.key.startsWith(NODE_ROLE_PREFIX) &&
      (r.operator === 'Equals' ||
        r.operator === 'In' ||
        r.operator === 'in' ||
        r.operator === 'Exists')
    ) {
      nodeRoles.add(r.key.slice(NODE_ROLE_PREFIX.length));
    }
  });
  if (nodeRoles.size === 1) {
    return t('console-app~Node role {{role}}', { role: [...nodeRoles][0] });
  }
  if (nodeRoles.size > 1) {
    return t('console-app~Node roles {{roles}}', { roles: [...nodeRoles].sort().join(', ') });
  }
  return t('console-app~Selected nodes');
};

export const formatHealthCheckSelector = (selector: Selector | undefined): string => {
  const raw = selectorToString(selector ?? {})
    .replace(/=,/g, ',')
    .replace(/=$/g, '');
  const formatted = raw.replace(/,/g, ', ');
  return formatted.trim() ? formatted : DASH;
};

export const formatUnhealthyConditionsDisplay = (
  conditions: MachineHealthCondition[] | NodeHealthCheckUnhealthyCondition[] | undefined,
): string => {
  if (!conditions?.length) {
    return DASH;
  }
  return conditions
    .map((c) => {
      const duration =
        'duration' in c
          ? formatDurationForDisplay(c.duration)
          : formatDurationForDisplay(c.timeout);
      const type = c.type ?? '';
      const status = c.status ?? '';
      if (duration) {
        return `${type}=${status} for ${duration}`;
      }
      return `${type}=${status}`;
    })
    .join(', ');
};

export const getHealthCheckLastAction = (healthCheck: K8sResourceKind): string | undefined =>
  healthCheck.status?.lastUpdateTime;

export const filterMachineHealthChecksForMachine = (
  machineHealthChecks: MachineHealthCheckKind[],
  machine: MachineKind,
): MachineHealthCheckKind[] =>
  machineHealthChecks.filter((hc) => {
    const selector = new LabelSelector(hc.spec?.selector || {});
    return selector.matches(machine);
  });

export const filterNodeHealthChecksForNode = (
  nodeHealthChecks: NodeHealthCheckKind[],
  node: NodeKind,
): NodeHealthCheckKind[] =>
  nodeHealthChecks.filter((nhc) => {
    const selector = new LabelSelector(nhc.spec?.selector || {});
    return selector.matches(node);
  });
