import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { taintsModal, tolerationsModal } from '@console/internal/components/modals';
import { useConfigureCountModal } from '@console/internal/components/modals/configure-count-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import type { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useAnnotationsModal } from '@console/shared/src/hooks/useAnnotationsModal';
import { useDeleteModal } from '@console/shared/src/hooks/useDeleteModal';
import { useLabelsModal } from '@console/shared/src/hooks/useLabelsModal';
import type { ActionObject } from './types';
import { CommonActionCreator } from './types';

/**
 * A React hook for retrieving common actions related to Kubernetes resources.
 *
 * @param kind - The K8s model for the resource.
 * @param resource - The specific resource instance for which to generate actions.
 * @param [filterActions] - Optional. If provided, the returned object will contain only the specified actions.
 * Specify which actions to include using CommonActionCreator enum values.
 * If omitted, it will contain all common actions.
 * @param  editPath - Optional URL path used for editing the resource.
 * @param [message] - Optional message to display in the delete modal.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns A tuple containing the actions object and a boolean indicating if actions are ready to use.
 * When isReady is false, do not access properties on the actions object.
 * When isReady is true, all requested actions are guaranteed to exist on the actions object.
 *
 */
export const useCommonActions = <T extends readonly CommonActionCreator[]>(
  kind: K8sModel | undefined,
  resource: K8sResourceKind | undefined,
  filterActions?: T,
  message?: JSX.Element,
  editPath?: string,
): [ActionObject<T>, boolean] => {
  const { t } = useTranslation();
  const launchAnnotationsModal = useAnnotationsModal(resource);
  const launchDeleteModal = useDeleteModal(resource, undefined, message);
  const launchLabelsModal = useLabelsModal(resource);
  const launchCountModal = useConfigureCountModal({
    resourceKind: kind,
    resource,
    defaultValue: 0,
    // t('public~Edit Pod count')
    titleKey: 'public~Edit Pod count',
    labelKey: kind?.labelPluralKey,
    // t('public~{{resourceKinds}} maintain the desired number of healthy pods.')
    messageKey: 'public~{{resourceKinds}} maintain the desired number of healthy pods.',
    messageVariables: { resourceKinds: kind?.labelPlural },
    path: '/spec/replicas',
    buttonTextKey: 'public~Save',
    opts: { path: 'scale' },
  });

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const actualEditPath = useMemo(() => {
    if (editPath) {
      return editPath;
    }
    if (!kind || !resource) {
      return '';
    }
    const reference = kind.crd ? referenceFor(resource) : kind.kind;
    return `${resourceObjPath(resource, reference)}/yaml`;
  }, [kind, resource, editPath]);

  const factory = useMemo(
    () => ({
      [CommonActionCreator.Delete]: (): Action => ({
        id: 'delete-resource',
        label: t('console-app~Delete {{kind}}', { kind: kind?.kind }),
        cta: launchDeleteModal,
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'delete'),
      }),
      [CommonActionCreator.Edit]: (): Action => {
        return {
          id: 'edit-resource',
          label: t('console-app~Edit {{kind}}', { kind: kind?.kind }),
          cta: {
            href: actualEditPath,
          },
          accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'update'),
        };
      },
      [CommonActionCreator.ModifyLabels]: (): Action => ({
        id: 'edit-labels',
        label: t('console-app~Edit labels'),
        cta: launchLabelsModal,
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
      [CommonActionCreator.ModifyAnnotations]: (): Action => ({
        id: 'edit-annotations',
        label: t('console-app~Edit annotations'),
        cta: launchAnnotationsModal,
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
      [CommonActionCreator.ModifyCount]: (): Action => ({
        id: 'edit-pod-count',
        label: t('console-app~Edit Pod count'),
        cta: launchCountModal,
        accessReview: asAccessReview(
          kind as K8sModel,
          resource as K8sResourceKind,
          'patch',
          'scale',
        ),
      }),
      [CommonActionCreator.ModifyTolerations]: (): Action => ({
        id: 'edit-toleration',
        label: t('console-app~Edit tolerations'),
        cta: () =>
          tolerationsModal({
            resourceKind: kind,
            resource,
            modalClassName: 'modal-lg',
          }),
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
      [CommonActionCreator.ModifyTaints]: (): Action => ({
        id: 'edit-taints',
        label: t('console-app~Edit taints'),
        cta: () =>
          taintsModal({
            resourceKind: kind,
            resource,
          }),
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
      [CommonActionCreator.AddStorage]: (): Action => ({
        id: 'add-storage',
        label: t('console-app~Add storage'),
        cta: {
          href: `${resourceObjPath(
            resource as K8sResourceKind,
            kind?.crd ? referenceFor(resource as K8sModel) : (kind?.kind as string),
          )}/attach-storage`,
        },
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
    }),
    // Excluding stable modal launcher functions (tolerationsModal, taintsModal)
    // to prevent unnecessary re-renders
    // TODO: remove once all Modals have been updated to useOverlay
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      kind,
      resource,
      t,
      message,
      actualEditPath,
      launchAnnotationsModal,
      launchDeleteModal,
      launchLabelsModal,
    ],
  );

  const result = useMemo((): [ActionObject<T>, boolean] => {
    const actions = {} as ActionObject<T>;

    if (!kind || !resource) {
      return [actions, false];
    }

    // filter and initialize requested actions or construct list of all CommonActions
    const actionsToInclude = memoizedFilterActions || Object.values(CommonActionCreator);

    actionsToInclude.forEach((actionType) => {
      if (factory[actionType]) {
        actions[actionType] = factory[actionType]();
      }
    });

    return [actions, true];
  }, [factory, memoizedFilterActions, kind, resource]);

  return result;
};
