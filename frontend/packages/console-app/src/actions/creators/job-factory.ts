import i18next from 'i18next';
import { configureJobParallelismModal } from '@console/internal/components/modals';
import { JobKind, K8sKind } from '@console/internal/module/k8s';
import { ResourceActionFactory } from './common-factory';

export const JobActionFactory: ResourceActionFactory = {
  ModifyJobParallelism: (kind: K8sKind, obj: JobKind) => ({
    id: 'edit-parallelism',
    label: i18next.t('console-app~Edit parallelism'),
    cta: () =>
      configureJobParallelismModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  }),
};
