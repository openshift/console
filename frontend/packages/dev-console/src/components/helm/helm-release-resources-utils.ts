import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const flattenResources = (resources: { [kind: string]: { data: K8sResourceKind } }) =>
  Object.keys(resources).reduce((acc, kind) => {
    if (!_.isEmpty(resources[kind].data)) {
      acc.push(resources[kind].data);
    }
    return acc;
  }, []);

export const mockValues = {
  affinity: {},
  fullnameOverride: '',
  image: {
    pullPolicy: 'IfNotPresent',
    repository: 'nginx',
  },
  ingress: {
    annotations: {},
    enabled: false,
    hosts: [
      {
        host: 'chart-example.local',
        paths: [],
      },
    ],
    tls: [],
  },
  nameOverride: '',
  nodeSelector: {},
  replicaCount: 1,
  resources: {},
  service: {
    port: 80,
    type: 'ClusterIP',
  },
  tolerations: [],
};
