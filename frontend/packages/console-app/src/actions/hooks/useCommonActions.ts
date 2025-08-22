import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import {
  annotationsModalLauncher,
  deleteModal,
  configureReplicaCountModal,
  podSelectorModal,
  tolerationsModal,
} from '@console/internal/components/modals';
import { resourceObjPath, asAccessReview } from '@console/internal/components/utils';
import { referenceForModel, K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { useLabelsModal } from '@console/shared/src/hooks/useLabelsModal';
import { CommonActionCreator, ActionObject } from './types';

/**
 * A React hook for retrieving common actions related to Kubernetes resources.
 *
 * @param {K8sModel | undefined} kind - The K8s model for the resource.
 * @param {K8sResourceKind | undefined} resource - The specific resource instance for which to generate actions.
 * @param [filterActions] - Optional. If provided, the returned object will contain only the specified actions.
 * Specify which actions to include using CommonActionCreator enum values.
 * If omitted, it will contain all common actions.
 * @param {JSX.Element} [message] - Optional message to display in the delete modal.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {[ActionObject<T>, boolean]} A tuple containing the actions object and a boolean indicating if actions are ready to use.
 * When isReady is false, do not access properties on the actions object.
 * When isReady is true, all requested actions are guaranteed to exist on the actions object.
 *
 * @example
 * // Getting Delete and Edit actions for a resource
 * const MyResourceComponent = ({ kind, resource }) => {
 *   const [actions] = useCommonActions(kind, resource, [CommonActionCreator.Delete, CommonActionCreator.Edit]);
 *   return <Kebab actions={ Object.values(actions) } />;
 * };
 *
 * @example
 * // Getting actions in specific order
 * const MyResourceComponent = ({ kind, resource }) => {
 *   const [commonActions, isReady] = useCommonActions(kind, resource, [CommonActionCreator.ModifyCount, CommonActionCreator.AddStorage]);
 *   const actions = [
 *     ...(isReady ? [commonActions.ModifyCount] : []),
 *     ...otherActions,
 *     ...(isReady ? [commonActions.AddStorage] : []),
 *   ];
 *   return <Kebab actions={actions} />;
 * };
 */
export const useCommonActions = <T extends readonly CommonActionCreator[]>(
  kind: K8sModel | undefined,
  resource: K8sResourceKind | undefined,
  filterActions?: T,
  message?: JSX.Element,
): [ActionObject<T>, boolean] => {
  const { t } = useTranslation();
  const labelsModalLauncher = useLabelsModal(resource);

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [CommonActionCreator.Delete]: (): Action => ({
        id: `delete-resource`,
        label: t('console-app~Delete {{kind}}', { kind: kind?.kind }),
        cta: () =>
          deleteModal({
            kind,
            resource,
            message,
          }),
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'delete'),
      }),
      [CommonActionCreator.Edit]: (): Action => ({
        id: `edit-resource`,
        label: t('console-app~Edit {{kind}}', { kind: kind?.kind }),
        cta: {
          href: `${resourceObjPath(
            resource as K8sResourceKind,
            kind?.crd ? referenceForModel(kind as K8sModel) : (kind?.kind as string),
          )}/yaml`,
        },
        // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'update'),
      }),
      [CommonActionCreator.ModifyLabels]: (): Action => ({
        id: 'edit-labels',
        label: t('console-app~Edit labels'),
        cta: () => labelsModalLauncher(),
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
      [CommonActionCreator.ModifyAnnotations]: (): Action => ({
        id: 'edit-annotations',
        label: t('console-app~Edit annotations'),
        cta: () =>
          annotationsModalLauncher({
            kind,
            resource,
            blocking: true,
          }),
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
      [CommonActionCreator.ModifyCount]: (): Action => ({
        id: 'edit-pod-count',
        label: t('console-app~Edit Pod count'),
        cta: () =>
          configureReplicaCountModal({
            resourceKind: kind,
            resource,
          }),
        accessReview: asAccessReview(
          kind as K8sModel,
          resource as K8sResourceKind,
          'patch',
          'scale',
        ),
      }),
      [CommonActionCreator.ModifyPodSelector]: (): Action => ({
        id: 'edit-pod-selector',
        label: t('console-app~Edit Pod selector'),
        cta: () =>
          podSelectorModal({
            kind,
            resource,
            blocking: true,
          }),
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
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
      [CommonActionCreator.AddStorage]: (): Action => ({
        id: 'add-storage',
        label: t('console-app~Add storage'),
        cta: {
          href: `${resourceObjPath(
            resource as K8sResourceKind,
            kind?.crd ? referenceForModel(kind as K8sModel) : (kind?.kind as string),
          )}/attach-storage`,
        },
        accessReview: asAccessReview(kind as K8sModel, resource as K8sResourceKind, 'patch'),
      }),
    }),
    [kind, resource, t, message, labelsModalLauncher],
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
