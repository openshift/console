import { KebabOption } from '@console/internal/components/utils';
import i18n from '@console/internal/i18n';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { setSinkPubsubModal } from '../components/modals';

export const setSinkPubsub = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  return {
    // t('knative-plugin~Move {{kind}}')
    labelKey: 'knative-plugin~Move {{kind}}',
    labelKind: {
      kind: model.labelKey ? i18n.t(model.labelKey) : model.label,
    },
    callback: () =>
      setSinkPubsubModal({
        source,
        resourceType: model.labelKey ? i18n.t(model.labelKey) : model.label,
      }),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: source.metadata.name,
      namespace: source.metadata.namespace,
      verb: 'update',
    },
  };
};
