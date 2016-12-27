import {k8sEnum} from './enum';
import {util} from './util';

import * as k8sPods from './pods';

export const clean = deployment => {
  util.nullifyEmpty(deployment.metadata, ['annotations', 'labels']);
  k8sPods.clean(deployment.spec.template);
  util.deleteNulls(deployment.metadata);
  util.deleteNulls(deployment.spec);
};

export const getEmpty = ns => ({
  metadata: {
    annotations: [],
    labels: [],
    name: null,
    namespace: ns || k8sEnum.DefaultNS,
  },
  spec: {
    replicas: 0,
    selector: null,
    strategy: {
      type: 'RollingUpdate'
    },
    template: k8sPods.getEmpty(),
    templateRef: null,
  },
});
