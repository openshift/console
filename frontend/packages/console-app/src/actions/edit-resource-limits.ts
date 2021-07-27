import { KebabOption } from '@console/internal/components/utils';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { resourceLimitsModal } from '../components/modals/resource-limits';

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const EditResourceLimits = (kind: K8sKind, obj: K8sResourceKind): KebabOption => ({
  // t('console-app~Edit resource limits')
  labelKey: 'console-app~Edit resource limits',
  callback: () =>
    resourceLimitsModal({
      model: kind,
      resource: obj,
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});
