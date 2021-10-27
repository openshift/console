import * as _ from 'lodash';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '../hooks/useK8sModel';

export enum ResourceUtilizationQuery {
  MEMORY = 'MEMORY',
  CPU = 'CPU',
  FILESYSTEM = 'FILESYSTEM',
  NETWORK_IN = 'NETWORK_IN',
  NETWORK_OUT = 'NETWORK_OUT',
  QUOTA_LIMIT = 'QUOTA_LIMIT',
  QUOTA_REQUEST = 'QUOTA_REQUEST',
}

const podMetricsQueries = {
  [ResourceUtilizationQuery.MEMORY]: _.template(
    "sum(container_memory_working_set_bytes{pod='<%= name %>',container=''}) BY (pod)",
  ),
  [ResourceUtilizationQuery.CPU]: _.template("pod:container_cpu_usage:sum{pod='<%= name %>'}"),
  [ResourceUtilizationQuery.FILESYSTEM]: _.template(
    "pod:container_fs_usage_bytes:sum{pod='<%= name %>'}",
  ),
  [ResourceUtilizationQuery.NETWORK_IN]: _.template(
    "(sum(irate(container_network_receive_bytes_total{pod='<%= name %>'}[5m])) by (pod, interface)) + on(pod,interface) group_left(network_name) ( pod_network_name_info )",
  ),
  [ResourceUtilizationQuery.NETWORK_OUT]: _.template(
    "(sum(irate(container_network_transmit_bytes_total{pod='<%= name %>'}[5m])) by (pod, interface)) + on(pod,interface) group_left(network_name) ( pod_network_name_info )",
  ),
  [ResourceUtilizationQuery.QUOTA_LIMIT]: _.template(
    "sum by (pod, resource) (kube_pod_resource_limit{resource='<%= resource %>',pod='<%= name %>'})",
  ),
  [ResourceUtilizationQuery.QUOTA_REQUEST]: _.template(
    "sum by (pod, resource) (kube_pod_resource_request{resource='<%= resource %>',pod='<%= name %>'})",
  ),
};

const podControllerMetricsQueries = {
  [ResourceUtilizationQuery.MEMORY]: _.template(
    "sum(container_memory_working_set_bytes{container!=''} * on(pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.CPU]: _.template(
    "sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{} * on(pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.FILESYSTEM]: _.template(
    "sum(pod:container_fs_usage_bytes:sum * on(pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.NETWORK_IN]: _.template(
    "sum(irate(container_network_receive_bytes_total[5m]) * on (pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.NETWORK_OUT]: _.template(
    "sum(irate(container_network_transmit_bytes_total[5m]) * on (pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
};

export const getPodMetricsQueries = (name: string): { [key: string]: string[] } => ({
  [ResourceUtilizationQuery.MEMORY]: [
    podMetricsQueries[ResourceUtilizationQuery.MEMORY]({ name }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_LIMIT]({ name, resource: 'memory' }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_REQUEST]({ name, resource: 'memmory' }),
  ],
  [ResourceUtilizationQuery.CPU]: [
    podMetricsQueries[ResourceUtilizationQuery.CPU]({ name }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_LIMIT]({ name, resource: 'cpu' }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_REQUEST]({ name, resource: 'cpu' }),
  ],
  [ResourceUtilizationQuery.FILESYSTEM]: [
    podMetricsQueries[ResourceUtilizationQuery.FILESYSTEM]({ name }),
  ],
  [ResourceUtilizationQuery.NETWORK_IN]: [
    podMetricsQueries[ResourceUtilizationQuery.NETWORK_IN]({ name }),
  ],
  [ResourceUtilizationQuery.NETWORK_OUT]: [
    podMetricsQueries[ResourceUtilizationQuery.NETWORK_OUT]({ name }),
  ],
});

export const getPodControllerMetricsQueries = (
  name: string,
  type: string,
): { [key: string]: string[] } => ({
  [ResourceUtilizationQuery.MEMORY]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.MEMORY]({ name, type }),
  ],
  [ResourceUtilizationQuery.CPU]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.CPU]({ name, type }),
  ],
  [ResourceUtilizationQuery.FILESYSTEM]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.FILESYSTEM]({ name, type }),
  ],
  [ResourceUtilizationQuery.NETWORK_IN]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.NETWORK_IN]({ name, type }),
  ],
  [ResourceUtilizationQuery.NETWORK_OUT]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.NETWORK_OUT]({ name, type }),
  ],
});

export const useResourceMetricsQueries = (obj: K8sResourceKind): { [key: string]: string[] } => {
  const [model] = useK8sModel(referenceFor(obj));
  if (model) {
    return model.id === 'pod'
      ? getPodMetricsQueries(obj.metadata.name)
      : getPodControllerMetricsQueries(obj.metadata.name, model.id);
  }
  return null;
};
