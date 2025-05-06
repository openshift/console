import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useConfigureJobParallelismModalProvider } from '@console/internal/components/modals/configure-count-modal';
import { JobKind, K8sKind } from '@console/internal/module/k8s';

export type UseJobActions = (kind: K8sKind, obj: JobKind) => Action[];

export const useJobActions: UseJobActions = (kind, obj) => {
  const paralelismModalLauncher = useConfigureJobParallelismModalProvider({
    resourceKind: kind,
    resource: obj,
  });
  const { t } = useTranslation();
  const result: Action[] = React.useMemo(() => {
    return [
      {
        id: 'edit-parallelism',
        label: t('console-app~Edit parallelism'),
        cta: paralelismModalLauncher,
        accessReview: {
          group: kind.apiGroup,
          resource: kind.plural,
          name: obj.metadata.name,
          namespace: obj.metadata.namespace,
          verb: 'patch',
        },
      },
    ];
  }, [kind, obj, t, paralelismModalLauncher]);
  return result;
};
