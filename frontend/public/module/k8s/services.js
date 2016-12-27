import {k8sEnum} from './enum';
import {util} from './util';

export const clean = service => {
  util.nullifyEmpty(service.metadata, ['annotations', 'labels']);
  util.nullifyEmpty(service.spec, ['ports']);
  util.deleteNulls(service.metadata);
  util.deleteNulls(service.spec);
};

export const getEmptyPort = () => ({
  name: null,
  port: null,
  targetPort: null,
  protocol: 'TCP',
  nodePort: null,
});

export const getEmpty = ns => ({
  metadata: {
    annotations: [],
    labels: [],
    name: null,
    namespace: ns || k8sEnum.DefaultNS,
  },
  spec: {
    type: 'ClusterIP',
    ports: [],
    clusterIP: null,
    selector: null,
    sessionAffinity: 'None',
  },
});
