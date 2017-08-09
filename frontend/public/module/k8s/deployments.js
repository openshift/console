import {util} from './util';

import * as k8sPods from './pods';

export const clean = deployment => {
  util.nullifyEmpty(deployment.metadata, ['annotations', 'labels']);
  k8sPods.clean(deployment.spec.template);
  util.deleteNulls(deployment.metadata);
  util.deleteNulls(deployment.spec);
};
