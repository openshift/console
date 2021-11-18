import { serviceBindingModal } from '@console/app/src/components/modals/service-binding';
import { KebabAction } from '@console/internal/components/utils';
import { ServiceBindingModel } from '@console/internal/models';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const CreateServiceBinding: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
  labelKey: 'public~Create Service Binding',
  callback: () =>
    serviceBindingModal({
      model: kind,
      resource: obj,
    }),
  accessReview: {
    group: ServiceBindingModel.apiGroup,
    resource: ServiceBindingModel.plural,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});
