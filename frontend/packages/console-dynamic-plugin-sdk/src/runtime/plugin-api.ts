/* eslint-disable global-require, @typescript-eslint/no-require-imports */

export const exposePluginAPI = () => {
  window.api = {
    useK8sWatchResource: require('@console/internal/components/utils/k8s-watch-hook')
      .useK8sWatchResource,
    useK8sWatchResources: require('@console/internal/components/utils/k8s-watch-hook')
      .useK8sWatchResources,
    useResolvedExtensions: require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
      .useResolvedExtensions,
  };
};
