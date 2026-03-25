import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/dynamic-core-api';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  getGroupVersionKindForModel,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { defaultClassAnnotation } from '@console/internal/components/storage-class';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import type { K8sResourceCommon, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useStorageClassActions = (
  storageClass: K8sResourceKind,
): [Action[], boolean, boolean] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const [storageClassModel, inFlight] = useK8sModel(referenceFor(storageClass));
  const commonActions = useCommonResourceActions(storageClassModel, storageClass);
  const [storageClasses] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: getGroupVersionKindForModel(storageClassModel),
    isList: true,
  });

  const existingDefaultStorageClass = useMemo(
    () =>
      storageClasses.find((sc) => sc.metadata?.annotations?.[defaultClassAnnotation] === 'true'),
    [storageClasses],
  );

  const isDefaultStorageClass =
    storageClass.metadata?.annotations?.[defaultClassAnnotation] === 'true';

  const storageClassActions: Action[] = useMemo(
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
            launchModal(ErrorModal, { error: error.message });
          }
        },
        id: 'make-default-storageclass',
        label: t('console-app~Set as default'),
        insertBefore: 'delete-resource',
      } as Action,
      ...commonActions,
    ],
    [
      storageClass,
      storageClassModel,
      t,
      existingDefaultStorageClass,
      isDefaultStorageClass,
      commonActions,
      launchModal,
    ],
  );

  return [storageClassActions, !inFlight, false];
};
