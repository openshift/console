import type { Model } from '@patternfly/react-topology';
import type { K8sResourceKind } from '@console/internal/module/k8s';

export const isServiceBindable = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  return resource.metadata.labels?.['app.kubernetes.io/component'] === 'external-service';
};
