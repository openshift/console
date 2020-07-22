import * as _ from 'lodash';
import {
  PrometheusHealthHandler,
  URLHealthHandler,
  SubsystemHealth,
  GetOperatorsWithStatuses,
  GetOperatorStatusPriority,
} from '@console/plugin-sdk';
import {
  HealthState,
  healthStateMapping,
} from '@console/shared/src/components/dashboard/status-card/states';
import { coFetch } from '@console/internal/co-fetch';
import {
  ClusterVersionKind,
  ClusterUpdateStatus,
  getClusterUpdateStatus,
  getClusterOperatorStatus,
  OperatorStatus,
  ClusterOperator,
} from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { humanizePercentage } from '@console/internal/components/utils/units';
import { getOperatorsStatus } from '@console/shared/src/components/dashboard/status-card/state-utils';
import { pluralize } from '@patternfly/react-core';

export const fetchK8sHealth = async (url: string) => {
  const response = await coFetch(url);
  return response.text();
};

export const getK8sHealthState: URLHealthHandler<string> = (k8sHealth, error, resource) => {
  if (error) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!k8sHealth) {
    return { state: HealthState.LOADING };
  }
  if (
    getClusterUpdateStatus(_.get(resource, 'data') as ClusterVersionKind) ===
    ClusterUpdateStatus.Updating
  ) {
    return { state: HealthState.UPDATING, message: 'Updating' };
  }
  return { state: k8sHealth === 'ok' ? HealthState.OK : HealthState.ERROR };
};

export const getControlPlaneComponentHealth = (
  response: PrometheusResponse,
  error,
): SubsystemHealth => {
  if (error) {
    return {
      state: HealthState.NOT_AVAILABLE,
      message: healthStateMapping[HealthState.NOT_AVAILABLE].message,
    };
  }
  if (!response) {
    return { state: HealthState.LOADING };
  }
  const value = response.data?.result?.[0]?.value?.[1];
  if (_.isNil(value)) {
    return { state: HealthState.UNKNOWN, message: healthStateMapping[HealthState.UNKNOWN].message };
  }
  const perc = humanizePercentage(value);
  if (perc.value > 90) {
    return { state: HealthState.OK, message: perc.string };
  }
  if (perc.value > 70) {
    return { state: HealthState.WARNING, message: perc.string };
  }
  return { state: HealthState.ERROR, message: perc.string };
};

export const getWorstStatus = (
  componentsHealth: SubsystemHealth[],
): { state: HealthState; message: string; count: number } => {
  const withPriority = componentsHealth.map((h) => healthStateMapping[h.state]);
  const mostImportantState = Math.max(...withPriority.map(({ priority }) => priority));
  const worstStatuses = withPriority.filter(({ priority }) => priority === mostImportantState);
  return {
    state: worstStatuses[0].health,
    message: worstStatuses[0].message,
    count: worstStatuses.length,
  };
};

export const getControlPlaneHealth: PrometheusHealthHandler = (responses) => {
  const componentsHealth = responses.map(({ response, error }) =>
    getControlPlaneComponentHealth(response, error),
  );
  if (componentsHealth.some((c) => c.state === HealthState.LOADING)) {
    return { state: HealthState.LOADING };
  }
  const worstStatus = getWorstStatus(componentsHealth);

  return {
    state: worstStatus.state,
    message: worstStatus.message
      ? worstStatus.count === 4
        ? worstStatus.message
        : `${pluralize(worstStatus.count, 'component')} ${worstStatus.message.toLowerCase()}`
      : null,
  };
};

export const getClusterOperatorStatusPriority: GetOperatorStatusPriority<ClusterOperator> = (
  co,
) => {
  const status = getClusterOperatorStatus(co);
  if (status === OperatorStatus.Degraded) {
    return { ...healthStateMapping[HealthState.WARNING], title: status };
  }
  if (status === OperatorStatus.Unknown) {
    return { ...healthStateMapping[HealthState.UNKNOWN], title: status };
  }
  if (status === OperatorStatus.Updating) {
    return { ...healthStateMapping[HealthState.UPDATING], title: status };
  }
  return { ...healthStateMapping[HealthState.OK], title: status };
};

export const getClusterOperatorHealthStatus: GetOperatorsWithStatuses<ClusterOperator> = (
  resources,
) => {
  return (resources.clusterOperators.data as ClusterOperator[]).map((co) =>
    getOperatorsStatus<ClusterOperator>([co], getClusterOperatorStatusPriority),
  );
};
