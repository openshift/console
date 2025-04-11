import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/dynamic-core-api';
import {
  getGroupVersionKindForModel,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { errorModal } from '@console/internal/components/modals';
import { defaultClassAnnotation } from '@console/internal/components/storage-class';
import { asAccessReview } from '@console/internal/components/utils';
import { K8sResourceCommon, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';

export const useStorageClassActions = (
  storageClass: K8sResourceKind,
): [Action[], boolean, boolean] => {
  const { t } = useTranslation();
  const [storageClassModel, inFlight] = useK8sModel(referenceFor(storageClass));

  const [storageClasses] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(storageClassModel),
    isList: true,
  });

  const existingDefaultStorageClass = React.useMemo(
    () =>
      storageClasses.find((sc) => sc.metadata?.annotations?.[defaultClassAnnotation] === 'true'),
    [storageClasses],
  );

  const isDefaultStorageClass =
    storageClass.metadata?.annotations?.[defaultClassAnnotation] === 'true';

  const storageClassActions: Action[] = React.useMemo(
    () => [
      {
        accessReview: asAccessReview(storageClassModel, storageClass, 'patch'),
        disabled: isDefaultStorageClass,
        disabledTooltip: isDefaultStorageClass
          ? t('console-app~Current default StorageClass')
          : null,
        cta: async () => {
          try {
            await k8sPatchResource({
              data: [
                ...(!storageClass?.metadata?.annotations
                  ? [
                      {
                        op: 'add',
                        path: '/metadata/annotations',
                        value: {},
                      },
                    ]
                  : []),
                {
                  op: 'replace',
                  path: `/metadata/annotations/${defaultClassAnnotation.replace('/', '~1')}`,
                  value: 'true',
                },
              ],
              model: storageClassModel,
              resource: storageClass,
            });

            if (existingDefaultStorageClass)
              await k8sPatchResource({
                data: [
                  {
                    op: 'replace',
                    path: `/metadata/annotations/${defaultClassAnnotation.replace('/', '~1')}`,
                    value: 'false',
                  },
                ],
                model: storageClassModel,
                resource: existingDefaultStorageClass,
              });
          } catch (error) {
            errorModal({ error });
          }
        },
        id: 'make-default-storageclass',
        label: t('console-app~Set as default'),
        insertBefore: 'delete-resource',
      } as Action,
      ...getCommonResourceActions(storageClassModel, storageClass),
    ],
    [storageClass, storageClassModel, t, existingDefaultStorageClass, isDefaultStorageClass],
  );

  return [storageClassActions, !inFlight, undefined];
};
