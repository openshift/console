import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/dynamic-core-api';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  getGroupVersionKindForModel,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import {
  defaultClassAnnotation,
  kubevirtDefaultClassAnnotation,
} from '@console/internal/components/storage-class';
import { asAccessReview } from '@console/internal/components/utils';
import { K8sResourceCommon, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useStorageClassActions = (
  storageClass: K8sResourceKind,
): [Action[], boolean, boolean] => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const pluginStore = usePluginStore();
  const isKubevirtPluginActive = pluginStore
    .getAllowedDynamicPluginNames()
    .includes('kubevirt-plugin');

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

  const existingKubevirtDefaultStorageClass = useMemo(
    () =>
      storageClasses.find(
        (sc) => sc.metadata?.annotations?.[kubevirtDefaultClassAnnotation] === 'true',
      ),
    [storageClasses],
  );

  const isDefaultStorageClass =
    storageClass.metadata?.annotations?.[defaultClassAnnotation] === 'true';

  const isKubevirtDefaultStorageClass =
    storageClass.metadata?.annotations?.[kubevirtDefaultClassAnnotation] === 'true';

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
        insertBefore: isKubevirtPluginActive
          ? 'make-kubevirt-default-storageclass'
          : 'delete-resource',
      } as Action,
      ...(isKubevirtPluginActive
        ? [
            {
              accessReview: asAccessReview(storageClassModel, storageClass, 'patch'),
              disabled: isKubevirtDefaultStorageClass,
              disabledTooltip: isKubevirtDefaultStorageClass
                ? t('console-app~Current default StorageClass for VirtualMachines')
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
                        path: `/metadata/annotations/${kubevirtDefaultClassAnnotation.replace(
                          '/',
                          '~1',
                        )}`,
                        value: 'true',
                      },
                    ],
                    model: storageClassModel,
                    resource: storageClass,
                  });

                  if (existingKubevirtDefaultStorageClass)
                    await k8sPatchResource({
                      data: [
                        {
                          op: 'replace',
                          path: `/metadata/annotations/${kubevirtDefaultClassAnnotation.replace(
                            '/',
                            '~1',
                          )}`,
                          value: 'false',
                        },
                      ],
                      model: storageClassModel,
                      resource: existingKubevirtDefaultStorageClass,
                    });
                } catch (error) {
                  launchModal(ErrorModal, { error: error.message });
                }
              },
              id: 'make-kubevirt-default-storageclass',
              label: t('console-app~Set as default for VirtualMachines'),
              insertBefore: 'delete-resource',
            } as Action,
          ]
        : []),
      ...commonActions,
    ],
    [
      storageClass,
      storageClassModel,
      t,
      existingDefaultStorageClass,
      existingKubevirtDefaultStorageClass,
      isKubevirtDefaultStorageClass,
      isKubevirtPluginActive,
      isDefaultStorageClass,
      commonActions,
      launchModal,
    ],
  );

  return [storageClassActions, !inFlight, false];
};
