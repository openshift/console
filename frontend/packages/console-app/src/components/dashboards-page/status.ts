import * as _ from 'lodash';
import { PrometheusHealthHandler, URLHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { coFetch } from '@console/internal/co-fetch';
import {
  ClusterVersionKind,
  ClusterUpdateStatus,
  getClusterUpdateStatus,
} from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { humanizePercentage } from '@console/internal/components/utils/units';
import { SubsystemHealth } from '@console/internal/components/dashboards-page/overview-dashboard/health-card';

export const fetchK8sHealth = async (url: string) => {
  const response = await coFetch(url);
  return response.text();
};

export const getK8sHealthState: URLHealthHandler<string> = (k8sHealth, error, resource) => {
  if (error) {
    return { state: HealthState.UNKNOWN };
  }
  if (!k8sHealth || !_.get(resource, 'loaded')) {
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
    return { state: HealthState.UNKNOWN, message: 'Not available' };
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

export const getControlPlaneHealth: PrometheusHealthHandler = (responses = [], errors = []) => {
  const componentsHealth = responses.map((r, index) =>
    getControlPlaneComponentHealth(r, errors[index]),
  );
  if (componentsHealth.some((c) => c.state === HealthState.LOADING)) {
    return { state: HealthState.LOADING };
  }
  const errComponents = componentsHealth.filter(
    (c) =>
      c.state === HealthState.WARNING ||
      c.state === HealthState.ERROR ||
      c.state === HealthState.UNKNOWN,
  );
  if (errComponents.length) {
    return {
      state: errComponents.length === 4 ? HealthState.UNKNOWN : HealthState.WARNING,
      message: errComponents.length === 4 ? null : `${errComponents.length} components degraded`,
    };
  }
  return { state: HealthState.OK };
};
