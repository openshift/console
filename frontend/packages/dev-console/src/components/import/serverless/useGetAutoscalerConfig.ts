import { useMemo } from 'react';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';
import type { ConfigMapKind } from '@console/internal/module/k8s';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';

export const useGetAutoscalerConfig = () => {
  const [configmap, configmapLoaded, configmapError] = useK8sGet<ConfigMapKind>(
    ConfigMapModel,
    'config-autoscaler',
    'knative-serving',
  );
  // The parsed config must keep a stable identity across re-renders: consumers
  // (e.g. useUpdateKnScalingDefaultValues) track it by reference to detect
  // changes, and safeYAMLToJS returns a fresh object on every call.
  const config = useMemo(
    // eslint-disable-next-line no-underscore-dangle
    () => configmapLoaded && !configmapError && safeYAMLToJS(configmap.data._example),
    [configmap, configmapLoaded, configmapError],
  );
  return config;
};
