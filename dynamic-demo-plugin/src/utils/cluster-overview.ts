import { GetMultilineQueries, GetQuery, Humanize } from '@openshift-console/dynamic-plugin-sdk';

export const getUtilizationQuery: GetQuery = (nodeTypes) =>
  `
    sum(
      (
          1 - rate(node_cpu_seconds_total{mode="idle"}[2m])
          *
          on(namespace, pod) group_left(node) node_namespace_pod:kube_pod_info:{pod=~"node-exporter.+"}
      )
      *
      on(node) group_left(role) (
          max by (node) (kube_node_role{role=~"${nodeTypes?.length ? nodeTypes.join('|') : '.+'}"})
      )
    )
  `;

export const getUtilizationQueries: GetMultilineQueries = (nodeTypes) => [
  {
    query: 
      `
        sum(
          instance:node_network_receive_bytes_excluding_lo:rate1m
          *
          on(instance) group_left(role) (
            label_replace(max by (node) (kube_node_role{role=~"${nodeTypes?.length ? nodeTypes.join('|') : '.+'}"}), "instance", "$1", "node", "(.*)")
          )
        )
      `,
    desc: 'desc1',
  },
  {
    query:
      `
        sum(
          instance:node_network_transmit_bytes_excluding_lo:rate1m
          *
          on(instance) group_left(role) (
            label_replace(max by (node) (kube_node_role{role=~"${nodeTypes?.length ? nodeTypes.join('|') : '.+'}"}), "instance", "$1", "node", "(.*)")
          )
        )
      `,
    desc: 'desc2',
  },
];

export const humanize: Humanize = (val) => {
  const value = Number.parseInt(`${val}`);
  return {
    string: `${value}`,
    unit: '',
    value,
  };
};
