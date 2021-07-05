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
    "sum(container_memory_working_set_bytes{pod='<%= name %>',namespace='<%= namespace %>',container=''}) BY (pod, namespace)",
  ),
  [ResourceUtilizationQuery.CPU]: _.template(
    "pod:container_cpu_usage:sum{pod='<%= name %>',namespace='<%= namespace %>'}",
  ),
  [ResourceUtilizationQuery.FILESYSTEM]: _.template(
    "pod:container_fs_usage_bytes:sum{pod='<%= name %>',namespace='<%= namespace %>'}",
  ),
  [ResourceUtilizationQuery.NETWORK_IN]: _.template(
    "(sum(irate(container_network_receive_bytes_total{pod='<%= name %>', namespace='<%= namespace %>'}[5m])) by (pod, namespace, interface)) + on(namespace,pod,interface) group_left(network_name) ( pod_network_name_info )",
  ),
  [ResourceUtilizationQuery.NETWORK_OUT]: _.template(
    "(sum(irate(container_network_transmit_bytes_total{pod='<%= name %>', namespace='<%= namespace %>'}[5m])) by (pod, namespace, interface)) + on(namespace,pod,interface) group_left(network_name) ( pod_network_name_info )",
  ),
  [ResourceUtilizationQuery.QUOTA_LIMIT]: _.template(
    "sum by (pod, namespace, resource) (kube_pod_resource_limit{resource='<%= resource %>',pod='<%= name %>',namespace='<%= namespace %>'})",
  ),
  [ResourceUtilizationQuery.QUOTA_REQUEST]: _.template(
    "sum by (pod, namespace, resource) (kube_pod_resource_request{resource='<%= resource %>',pod='<%= name %>',namespace='<%= namespace %>'})",
  ),
};

const podControllerMetricsQueries = {
  [ResourceUtilizationQuery.MEMORY]: _.template(
    "sum(container_memory_working_set_bytes{namespace='<%= namespace %>',container!=''} * on(namespace,pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace='<%= namespace %>', workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.CPU]: _.template(
    "sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{namespace='<%= namespace %>'} * on(namespace,pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace='<%= namespace %>', workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.FILESYSTEM]: _.template(
    "sum(pod:container_fs_usage_bytes:sum{namespace='<%= namespace %>'}  * on(namespace,pod) group_left(workload, workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace='<%= namespace %>', workload='<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.NETWORK_IN]: _.template(
    "sum(irate(container_network_receive_bytes_total{namespace=~'<%= namespace %>'}[5m]) * on (namespace,pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
  [ResourceUtilizationQuery.NETWORK_OUT]: _.template(
    "sum(irate(container_network_transmit_bytes_total{namespace=~'<%= namespace %>'}[5m]) * on (namespace,pod) group_left(workload,workload_type) namespace_workload_pod:kube_pod_owner:relabel{namespace=~'<%= namespace %>', workload=~'<%= name %>', workload_type='<%= type %>'}) by (pod)",
  ),
};

export const getPodMetricsQueries = (
  name: string,
  namespace: string,
): { [key: string]: string[] } => ({
  [ResourceUtilizationQuery.MEMORY]: [
    podMetricsQueries[ResourceUtilizationQuery.MEMORY]({
      name,
      namespace,
    }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_LIMIT]({
      name,
      namespace,
      resource: 'memory',
    }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_REQUEST]({
      name,
      namespace,
      resource: 'memmory',
    }),
  ],
  [ResourceUtilizationQuery.CPU]: [
    podMetricsQueries[ResourceUtilizationQuery.CPU]({ name, namespace }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_LIMIT]({
      name,
      namespace,
      resource: 'cpu',
    }),
    podMetricsQueries[ResourceUtilizationQuery.QUOTA_REQUEST]({
      name,
      namespace,
      resource: 'cpu',
    }),
  ],
  [ResourceUtilizationQuery.FILESYSTEM]: [
    podMetricsQueries[ResourceUtilizationQuery.FILESYSTEM]({
      name,
      namespace,
    }),
  ],
  [ResourceUtilizationQuery.NETWORK_IN]: [
    podMetricsQueries[ResourceUtilizationQuery.NETWORK_IN]({
      name,
      namespace,
    }),
  ],
  [ResourceUtilizationQuery.NETWORK_OUT]: [
    podMetricsQueries[ResourceUtilizationQuery.NETWORK_OUT]({
      name,
      namespace,
    }),
  ],
});

export const getPodControllerMetricsQueries = (
  name: string,
  namespace: string,
  type: string,
): { [key: string]: string[] } => ({
  [ResourceUtilizationQuery.MEMORY]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.MEMORY]({
      name,
      namespace,
      type,
    }),
  ],
  [ResourceUtilizationQuery.CPU]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.CPU]({
      name,
      namespace,
      type,
    }),
  ],
  [ResourceUtilizationQuery.FILESYSTEM]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.FILESYSTEM]({
      name,
      namespace,
      type,
    }),
  ],
  [ResourceUtilizationQuery.NETWORK_IN]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.NETWORK_IN]({
      name,
      namespace,
      type,
    }),
  ],
  [ResourceUtilizationQuery.NETWORK_OUT]: [
    podControllerMetricsQueries[ResourceUtilizationQuery.NETWORK_OUT]({
      name,
      namespace,
      type,
    }),
  ],
});

export const useResourceMetricsQueries = (obj: K8sResourceKind): { [key: string]: string[] } => {
  const [model] = useK8sModel(referenceFor(obj));
  if (model) {
    return model.id === 'pod'
      ? getPodMetricsQueries(obj.metadata.name, obj.metadata.namespace)
      : getPodControllerMetricsQueries(obj.metadata.name, obj.metadata.namespace, model.id);
  }
  return null;
};
