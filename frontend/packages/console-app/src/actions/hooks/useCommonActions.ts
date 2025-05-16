import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import {
  annotationsModalLauncher,
  deleteModal,
  labelsModalLauncher,
  configureReplicaCountModal,
  podSelectorModal,
  tolerationsModal,
} from '@console/internal/components/modals';
import { resourceObjPath, asAccessReview } from '@console/internal/components/utils';
import { referenceFor, K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CommonActionCreator } from './types';

// Type to create an object with action creators as keys and Actions as values
type ActionObject<T extends readonly CommonActionCreator[]> = {
  [K in T[number]]: Action;
};

/**
 * A React hook for retrieving common actions related to Kubernetes resources.
 *
 * @param {K8sModel} kind - The K8s model for the resource.
 * @param {K8sResourceKind} obj - The specific resource instance for which to generate actions.
 * @param {CommonActionCreator[]} [filterActions] - Optional. If provided, the returned object will contain
 * only the specified actions. If omitted, it will contain all common actions.
 * @param {JSX.Element} [message] - Optional message to display in the delete modal.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {ActionObject<T>} An object containing the generated actions, accessible by action creator name (e.g., actions.Delete).
 * Use Object.values(actions) to convert to an array for spreading: [...Object.values(actions)]
 *
 * @example
 * // Getting Delete and Edit actions for a resource
 * const MyResourceComponent = ({ kind, obj }) => {
 *   const actions = useCommonActions(kind, obj, [CommonActionCreator.Delete, CommonActionCreator.Edit]);
 *   const deleteAction = actions.Delete;
 *   const editAction = actions.Edit;
 *   return <Kebab actions={Object.values(actions)} />;
 * };
 */
export const useCommonActions = <T extends readonly CommonActionCreator[]>(
  kind: K8sModel,
  obj: K8sResourceKind,
  filterActions?: T,
  message?: JSX.Element,
): ActionObject<T> => {
  const { t } = useTranslation();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = React.useMemo(
    () => ({
      [CommonActionCreator.Delete]: (): Action => ({
        id: `delete-resource`,
        label: t('console-app~Delete {{kind}}', { kind: kind.kind }),
        cta: () =>
          deleteModal({
            kind,
            resource: obj,
            message,
          }),
        accessReview: asAccessReview(kind, obj, 'delete'),
      }),
      [CommonActionCreator.Edit]: (): Action => ({
        id: `edit-resource`,
        label: t('console-app~Edit {{kind}}', { kind: kind.kind }),
        cta: {
          href: `${resourceObjPath(obj, kind.crd ? referenceFor(kind) : kind.kind)}/yaml`,
        },
        // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
        accessReview: asAccessReview(kind, obj, 'update'),
      }),
      [CommonActionCreator.ModifyLabels]: (): Action => ({
        id: 'edit-labels',
        label: t('console-app~Edit labels'),
        cta: () =>
          labelsModalLauncher({
            kind,
            resource: obj,
            blocking: true,
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
      [CommonActionCreator.ModifyAnnotations]: (): Action => ({
        id: 'edit-annotations',
        label: t('console-app~Edit annotations'),
        cta: () =>
          annotationsModalLauncher({
            kind,
            resource: obj,
            blocking: true,
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
      [CommonActionCreator.ModifyCount]: (): Action => ({
        id: 'edit-pod-count',
        label: t('console-app~Edit Pod count'),
        cta: () =>
          configureReplicaCountModal({
            resourceKind: kind,
            resource: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'patch', 'scale'),
      }),
      [CommonActionCreator.ModifyPodSelector]: (): Action => ({
        id: 'edit-pod-selector',
        label: t('console-app~Edit Pod selector'),
        cta: () =>
          podSelectorModal({
            kind,
            resource: obj,
            blocking: true,
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
      [CommonActionCreator.ModifyTolerations]: (): Action => ({
        id: 'edit-toleration',
        label: t('console-app~Edit tolerations'),
        cta: () =>
          tolerationsModal({
            resourceKind: kind,
            resource: obj,
            modalClassName: 'modal-lg',
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
      [CommonActionCreator.AddStorage]: (): Action => ({
        id: 'add-storage',
        label: t('console-app~Add storage'),
        cta: {
          href: `${resourceObjPath(obj, kind.crd ? referenceFor(kind) : kind.kind)}/attach-storage`,
        },
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
    }),
    [kind, obj, t, message],
  );

  return React.useMemo(() => {
    const result = {} as ActionObject<T>;
    // filter and initialize requested actions or construct list of all CommonActions
    const actionsToInclude = memoizedFilterActions || Object.values(CommonActionCreator);

    actionsToInclude.forEach((actionType) => {
      if (factory[actionType]) {
        (result as any)[actionType] = factory[actionType]();
      }
    });

    return result;
  }, [factory, memoizedFilterActions]);
};
