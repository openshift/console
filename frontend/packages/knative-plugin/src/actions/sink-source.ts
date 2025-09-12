import { createModalLauncher } from '@console/internal/components/factory/modal';
import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import SinkSource from '../components/sink-source/SinkSource';

const sinkSourceModal = createModalLauncher(SinkSource);

export const setSinkSource = (model: K8sKind, source: K8sResourceKind): KebabOption => {
  return {
    // t('knative-plugin~Move sink')
    labelKey: 'knative-plugin~Move sink',
    callback: () => sinkSourceModal({ source }),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: source.metadata?.name,
      namespace: source.metadata?.namespace,
      verb: 'update',
    },
  };
};
