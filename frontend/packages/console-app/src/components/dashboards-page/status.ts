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
  operatorHealthPriority,
} from '@console/shared/src/components/dashboard/status-card/states';
import { coFetch } from '@console/internal/co-fetch';
import { ClusterVersionKind, ClusterOperator } from '@console/internal/module/k8s/types';
import {
  ClusterUpdateStatus,
  getClusterUpdateStatus,
} from '@console/internal/module/k8s/cluster-settings';
import {
  getClusterOperatorStatus,
  OperatorStatus,
} from '@console/internal/module/k8s/cluster-operator';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { humanizePercentage } from '@console/internal/components/utils/units';
import { getOperatorsStatus } from '@console/shared/src/components/dashboard/status-card/state-utils';

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
  if (
    error ||
    (response &&
      response.status === 'success' &&
      _.isNil(_.get(response, 'data.result[0].value[1]')))
  ) {
    return { state: HealthState.NOT_AVAILABLE, message: 'Not available' };
  }
  if (!response) {
    return { state: HealthState.LOADING };
  }
  const perc = humanizePercentage(_.get(response, 'data.result[0].value[1]'));
  if (perc.value > 90) {
    return { state: HealthState.OK, message: perc.string };
  }
  if (perc.value > 70) {
    return { state: HealthState.WARNING, message: perc.string };
  }
  return { state: HealthState.ERROR, message: perc.string };
};

const errorStates = [HealthState.WARNING, HealthState.ERROR, HealthState.NOT_AVAILABLE];

export const getControlPlaneHealth: PrometheusHealthHandler = (responses = [], errors = []) => {
  const componentsHealth = responses.map((r, index) =>
    getControlPlaneComponentHealth(r, errors[index]),
  );
  if (componentsHealth.some((c) => c.state === HealthState.LOADING)) {
    return { state: HealthState.LOADING };
  }
  const errComponents = componentsHealth.filter(({ state }) => errorStates.includes(state));
  if (errComponents.length) {
    return {
      state: errComponents.length === 4 ? HealthState.NOT_AVAILABLE : HealthState.WARNING,
      message: errComponents.length === 4 ? null : `${errComponents.length} components degraded`,
    };
  }
  return { state: HealthState.OK };
};

export const getClusterOperatorStatusPriority: GetOperatorStatusPriority<ClusterOperator> = (
  co,
) => {
  const status = getClusterOperatorStatus(co);
  if (status === OperatorStatus.Degraded) {
    return { ...operatorHealthPriority[HealthState.WARNING], title: status };
  }
  if (status === OperatorStatus.Unknown) {
    return { ...operatorHealthPriority[HealthState.UNKNOWN], title: status };
  }
  if (status === OperatorStatus.Updating) {
    return { ...operatorHealthPriority[HealthState.UPDATING], title: status };
  }
  return { ...operatorHealthPriority[HealthState.OK], title: status };
};

export const getClusterOperatorHealthStatus: GetOperatorsWithStatuses<ClusterOperator> = (
  resources,
) => {
  return (resources.clusterOperators.data as ClusterOperator[]).map((co) =>
    getOperatorsStatus<ClusterOperator>([co], getClusterOperatorStatusPriority),
  );
};
