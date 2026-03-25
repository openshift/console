import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { ConfigureCountModal } from '@console/internal/components/modals/configure-count-modal';
import { ConfigureMachineAutoscalerModal } from '@console/internal/components/modals/configure-machine-autoscaler-modal';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { MachineSetModel } from '@console/internal/models';
import type { MachineSetKind } from '@console/internal/module/k8s';
import { MachineSetActionCreator } from './types';

/**
 * A React hook for retrieving actions related to a MachineSet resource.
 *
 * @param {MachineSetKind} obj - The specific MachineSet resource instance for which to generate actions.
 * @param {MachineSetActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all MachineSet actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting all actions for MachineSet resource
 * const MyMachineSetComponent = ({ obj }) => {
 *   const actions = useMachineSetActions(obj);
 *   return <Kebab actions={actions} />;
 * };
 */
export const useMachineSetActions = (
  obj: MachineSetKind,
  filterActions?: MachineSetActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const launcher = useOverlay();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [MachineSetActionCreator.EditMachineCount]: () => ({
        id: 'edit-machine-count',
        label: t('public~Edit Machine count'),
        cta: () =>
          launcher(ConfigureCountModal, {
            resourceKind: MachineSetModel,
            resource: obj,
            defaultValue: obj.spec?.replicas || 0,
            titleKey: 'public~Edit Machine count',
            messageKey: 'public~{{resourceKind}} maintain the proper number of healthy machines.',
            messageVariables: { resourceKind: MachineSetModel.labelPlural },
            path: '/spec/replicas',
            buttonTextKey: 'public~Save',
          }),
        accessReview: asAccessReview(MachineSetModel, obj, 'patch', 'scale'),
      }),
      [MachineSetActionCreator.CreateMachineAutoscaler]: () => ({
        id: 'create-machine-autoscaler',
        label: t('public~Create MachineAutoscaler'),
        cta: () =>
          launcher(ConfigureMachineAutoscalerModal, {
            machineSet: obj,
          }),
        accessReview: asAccessReview(MachineSetModel, obj, 'create', 'machineautoscalers'),
      }),
    }),
    [t, obj, launcher],
  );

  // filter and initialize requested actions or construct list of all MachineSetActions
  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [
      factory[MachineSetActionCreator.EditMachineCount](),
      factory[MachineSetActionCreator.CreateMachineAutoscaler](),
    ];
  }, [factory, memoizedFilterActions]);

  return actions;
};
