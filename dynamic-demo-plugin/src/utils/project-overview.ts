// Function declaration so the module factory can initialize the export before
// the shared module requires complete, regardless of evaluation order.
export function getUtilizationQuery(namespace: string) {
  return `count(kube_running_pod_ready{namespace='${namespace}'}) BY (namespace)`;
}
