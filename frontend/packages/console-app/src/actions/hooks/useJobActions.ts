import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { configureJobParallelismModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { JobModel } from '@console/internal/models';
import { JobKind } from '@console/internal/module/k8s';
import { JobActionCreator } from './types';

/**
 * A React hook for retrieving actions related to a Job resource.
 *
 * @param obj - The specific Job resource instance for which to generate actions.
 * @param [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all Job actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns An array containing the generated action(s).
 */
export const useJobActions = (obj: JobKind, filterActions?: JobActionCreator[]): Action[] => {
  const { t } = useTranslation();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [JobActionCreator.ModifyJobParallelism]: () => ({
        id: 'edit-parallelism',
        label: t('console-app~Edit parallelism'),
        cta: () =>
          configureJobParallelismModal({
            resourceKind: JobModel,
            resource: obj,
          }),
        accessReview: asAccessReview(JobModel, obj, 'patch'),
      }),
    }),
    [t, obj],
  );

  // filter and initialize requested actions or construct list of all PVCActions
  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [factory.ModifyJobParallelism()];
  }, [factory, memoizedFilterActions]);
  return actions;
};
