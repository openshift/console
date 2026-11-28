import { GetMultilineQueries, GetQuery, Humanize } from '@openshift-console/dynamic-plugin-sdk';

// Function declarations so the module factory can initialize the exports
// before the shared module requires complete, regardless of evaluation order.

export function getUtilizationQuery(nodeTypes: Parameters<GetQuery>[0]): ReturnType<GetQuery> {
  return `
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
}

export function getUtilizationQueries(
  nodeTypes: Parameters<GetMultilineQueries>[0],
): ReturnType<GetMultilineQueries> {
  return [
    {
      query: `
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
      query: `
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
}

export function humanize(val: Parameters<Humanize>[0]): ReturnType<Humanize> {
  const value = Number.parseInt(`${val}`);
  return {
    string: `${value}`,
    unit: '',
    value,
  };
}
