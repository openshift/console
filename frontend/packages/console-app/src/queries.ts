import { PodModel } from '@console/internal/models';

// The query used to compute the number of kube-apiserver instances that are up
// is a bit different than the ones used for the other control plane components
// because of how Kubernetes deal with the kube-apiserver Service endpoints.
// When a node is down, the kube-apiserver address on that node is removed from
// its Endpoint object which results in metrics for that kube-apiserver
// instance to not be scraped anymore. Meaning that the `up` timeserie for that
// kube-apiserver instance will not exist anymore and if we were to use the
// same query as the other components we will always see the kube-apiserver
// being 100% available when a node is down.  The solution to that problem is
// to rely on the number of kube-apiserver pods instead of the number of
// Prometheus targets it has.
export const API_SERVERS_UP =
  '(sum(up{job="apiserver"} == 1) / count(kube_pod_labels{label_app="openshift-kube-apiserver",label_apiserver="true",namespace="openshift-kube-apiserver"})) * 100';
export const CONTROLLER_MANAGERS_UP =
  '(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100';
export const SCHEDULERS_UP = '(sum(up{job="scheduler"} == 1) / count(up{job="scheduler"})) * 100';
export const API_SERVER_REQUESTS_SUCCESS =
  '(1 - (sum(rate(apiserver_request_total{code=~"5.."}[5m])) or vector(0))/ sum(rate(apiserver_request_total[5m]))) * 100';

export const enum Condition {
  DISK_PRESSURE = 'DiskPressure',
  PID_PRESSURE = 'PIDPressure',
  MEM_PRESSURE = 'MemoryPressure',
}

export const PressureQueries = {
  [Condition.DISK_PRESSURE]: (node: string) => [
    {
      model: PodModel,
      fieldSelector: `spec.nodeName=${node}`,
      metric: 'pod',
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_fs_reads_total{node="${node}"}))))`,
    },
  ],

  [Condition.MEM_PRESSURE]: (node: string) => [
    {
      model: PodModel,
      fieldSelector: `spec.nodeName=${node}`,
      metric: 'pod',
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_memory_working_set_bytes{node="${node}", container=""}))))`,
    },
  ],

  [Condition.PID_PRESSURE]: (node: string) => [
    {
      model: PodModel,
      fieldSelector: `spec.nodeName=${node}`,
      metric: 'pod',
      query: `(sort_desc(topk(25,sum by(pod, namespace) (container_processes{node="${node}"}))))`,
    },
  ],
};
