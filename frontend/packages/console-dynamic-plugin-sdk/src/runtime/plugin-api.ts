import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

export const exposePluginAPI = () => {
  window.api = {
    useK8sWatchResource,
  };
};
