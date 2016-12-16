import {k8sEnum} from './enum';
import {util} from './util';

import * as k8sPods from './pods';

export const clean = rc => {
  util.nullifyEmpty(rc.metadata, ['annotations', 'labels']);
  k8sPods.clean(rc.spec.template);
  util.deleteNulls(rc.metadata);
  util.deleteNulls(rc.spec);
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
    template: k8sPods.getEmpty(),
    templateRef: null,
  },
});
