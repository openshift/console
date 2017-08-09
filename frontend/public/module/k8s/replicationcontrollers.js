import {util} from './util';

import * as k8sPods from './pods';

export const clean = rc => {
  util.nullifyEmpty(rc.metadata, ['annotations', 'labels']);
  k8sPods.clean(rc.spec.template);
  util.deleteNulls(rc.metadata);
  util.deleteNulls(rc.spec);
};
