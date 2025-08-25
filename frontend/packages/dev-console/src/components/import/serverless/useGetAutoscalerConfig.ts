import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';

export const useGetAutoscalerConfig = () => {
  const [configmap, configmapLoaded, configmapError] = useK8sGet<ConfigMapKind>(
    ConfigMapModel,
    'config-autoscaler',
    'knative-serving',
  );
  // eslint-disable-next-line no-underscore-dangle
  const config = configmapLoaded && !configmapError && safeYAMLToJS(configmap?.data?.example || '');
  return config;
};
