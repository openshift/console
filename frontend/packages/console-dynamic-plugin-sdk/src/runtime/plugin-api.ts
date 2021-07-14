/* eslint-disable global-require, @typescript-eslint/no-require-imports */
import { exposedAPIs } from '@dynamic-sdk/provisional-api/exposedModules';

export const exposePluginAPI = () => {
  window.api = {
    useK8sWatchResource: require('@console/internal/components/utils/k8s-watch-hook')
      .useK8sWatchResource,
    useK8sWatchResources: require('@console/internal/components/utils/k8s-watch-hook')
      .useK8sWatchResources,
  };
  Object.assign(window.api, exposedAPIs);
};
