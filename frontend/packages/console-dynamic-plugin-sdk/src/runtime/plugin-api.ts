import * as _ from 'lodash';

import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/internal/components/utils/k8s-watch-hook';

export const exposePluginAPI = _.once(() => {
  window.api = {
    useK8sWatchResource,
    useK8sWatchResources,
  };
});
