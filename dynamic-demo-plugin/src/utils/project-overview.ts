export const getUtilizationQuery = (namespace: string) =>
    `count(kube_running_pod_ready{namespace='${namespace}'}) BY (namespace)`
