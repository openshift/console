import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ImageStreamModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const useJavaImageStreamEnabled = (): boolean => {
  const [resource, loaded] = useK8sGet<K8sResourceKind>(ImageStreamModel, 'java', 'openshift');

  if (!loaded || !resource) {
    return false;
  }
  return true;
};
