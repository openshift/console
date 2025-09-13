import { useMemo } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { redirect } from 'react-router-dom-v5-compat';
import { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { asAccessReview, resourceObjPath } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { cloneBuild } from '@console/internal/module/k8s/builds';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { BuildActionCreator, CommonActionCreator } from './types';
import { useCommonActions } from './useCommonActions';

/**
 * A React hook for retrieving actions related to a Build resource.
 *
 * @param obj - The specific Build resource instance for which to generate actions.
 * @param [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all Build actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns An array containing the generated action(s).
 *
 * @example
 * // Getting Build actions for Build resource
 * const MyBuildComponent = ({ obj }) => {
 *   const actions = useBuildsActions(obj);
 *   return <Kebab actions={actions} />;
 * };
 */
export const useBuildsActions = (
  obj: K8sResourceKind,
  filterActions?: BuildActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const [kindObj] = useK8sModel(referenceFor(obj));
  const [commonActions, commonActionsReady] = useCommonActions(kindObj, obj, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.Edit,
    CommonActionCreator.Delete,
  ]);

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const warningModalProps = useMemo(
    () => ({
      title: t('public~Cancel build?'),
      children: t('public~Are you sure you want to cancel build {{name}}?', {
        name: obj.metadata.name,
      }),
      confirmButtonVariant: ButtonVariant.danger,
      confirmButtonLabel: t('public~Yes, cancel'),
      cancelButtonLabel: t("public~No, don't cancel"),
      onConfirm: () => {
        return k8sPatchResource({
          model: kindObj,
          resource: obj,
          data: [
            {
              op: 'add',
              path: '/status/cancelled',
              value: true,
            },
          ],
        });
      },
    }),
    [t, obj, kindObj],
  );

  const cancelBuildModal = useWarningModal(warningModalProps);
  const launchModal = useOverlay();

  const factory = useMemo(
    () => ({
      [BuildActionCreator.CloneBuild]: () => ({
        id: 'clone-build',
        label: t('public~Rebuild'),
        cta: () =>
          cloneBuild(obj)
            .then((clone) => {
              redirect(resourceObjPath(clone, referenceFor(clone)));
            })
            .catch((err) => {
              const error = err.message;
              launchModal(ErrorModal, { error });
            }),
        accessReview: {
          group: kindObj.apiGroup,
          resource: kindObj.plural,
          subresource: 'clone',
          name: obj.metadata.name,
          namespace: obj.metadata.namespace,
          verb: 'create' as const,
        },
      }),
      [BuildActionCreator.CancelBuild]: () => ({
        id: 'cancel-build',
        label: t('public~Cancel build'),
        cta: () => cancelBuildModal(),
        accessReview: asAccessReview(kindObj, obj, 'patch'),
      }),
    }),
    [t, kindObj, obj, launchModal, cancelBuildModal],
  );

  const buildPhase = obj.status?.phase;
  const isCancellable = useMemo(
    () => buildPhase === 'Running' || buildPhase === 'Pending' || buildPhase === 'New',
    [buildPhase],
  );

  const actions = useMemo<Action[]>(() => {
    if (!commonActionsReady) {
      return [];
    }

    // If filterActions is provided, only return the specified actions
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]()).filter(Boolean);
    }

    // Otherwise return all build actions
    const buildActions: Action[] = [factory[BuildActionCreator.CloneBuild]()];

    // Add cancel action only if build is cancellable
    if (isCancellable) {
      buildActions.push(factory[BuildActionCreator.CancelBuild]());
    }

    // Add common actions
    buildActions.push(
      commonActions.ModifyLabels,
      commonActions.ModifyAnnotations,
      commonActions.Edit,
      commonActions.Delete,
    );

    return buildActions;
  }, [factory, isCancellable, commonActions, commonActionsReady, memoizedFilterActions]);

  return actions;
};
