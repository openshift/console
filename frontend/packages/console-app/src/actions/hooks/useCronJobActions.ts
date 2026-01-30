import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { JobModel } from '@console/internal/models';
import {
  k8sCreate,
  CronJobKind,
  JobKind,
  referenceFor,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import { CronJobActionCreator } from './types';

const startJob = (obj: CronJobKind): Promise<JobKind> => {
  const reqPayload = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: `${obj.metadata?.name}-${Date.now()}`,
      namespace: obj.metadata?.namespace,
      annotations: obj.metadata?.annotations,
      ownerReferences: [
        {
          apiVersion: 'batch/v1',
          controller: true,
          kind: 'CronJob',
          name: obj.metadata?.name,
          uid: obj.metadata?.uid,
        },
      ],
    },
    spec: {
      ...obj.spec.jobTemplate.spec,
    },
  };

  return k8sCreate(JobModel, reqPayload as K8sResourceCommon);
};

const startJobAccessReview = (obj: CronJobKind) => ({
  group: 'batch',
  resource: 'jobs',
  name: obj.metadata?.name,
  namespace: obj.metadata?.namespace,
  verb: 'create' as const,
});

const getStartJobPath = (job: JobKind): string | null => {
  const path = resourceObjPath(job, referenceFor(job));
  return path || null;
};

/**
 * A React hook for retrieving actions related to a CronJob resource.
 *
 * @param {CronJobKind} obj - The specific CronJob resource instance for which to generate actions.
 * @param {CronJobActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all CronJob actions. Invalid action creators in
 * `filterActions` are ignored; the reduce logic in `memoizedFilterActions` checks each creator via `factory` and
 * only includes actions where `typeof fn === 'function'`, so the returned array contains only valid actions.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 *
 * @returns {Action[]} An array containing the generated action(s).
 *
 * @example
 * // Getting all actions for CronJob resource
 * const MyCronJobComponent = ({ obj }) => {
 *   const actions = useCronJobActions(obj);
 *   return <Kebab actions={actions} />;
 * };
 */
export const useCronJobActions = (
  obj: CronJobKind,
  filterActions?: CronJobActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [CronJobActionCreator.StartJob]: () => ({
        id: 'start-job',
        label: t('console-app~Start Job'),
        cta: () => {
          startJob(obj)
            .then((job) => {
              const path = getStartJobPath(job);
              if (path) {
                navigate(path);
              }
            })
            .catch((error) => {
              // TODO: Show error in notification in the follow on tech-debt.
              // eslint-disable-next-line no-console
              console.error('Failed to start a Job.', error);
            });
        },
        accessReview: startJobAccessReview(obj),
      }),
    }),
    [obj, navigate, t],
  );

  // filter and initialize requested actions or construct list of all CronJobActions
  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.reduce<Action[]>((acc, creator) => {
        const fn = factory[creator];
        if (typeof fn === 'function') {
          acc.push(fn());
        }
        return acc;
      }, []);
    }
    return [factory[CronJobActionCreator.StartJob]()];
  }, [factory, memoizedFilterActions]);

  return actions;
};
