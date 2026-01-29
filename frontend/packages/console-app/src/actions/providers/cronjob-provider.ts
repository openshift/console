import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CronJobKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import {
  startJob,
  startJobLabel,
  startJobAccessReview,
  getStartJobPath,
} from '../creators/cronjob-factory';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { usePDBActions } from '../hooks/usePDBActions';

export const useCronJobActionsProvider = (resource: CronJobKind) => {
  const navigate = useNavigate();
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = useMemo(
    () => [
      {
        id: 'start-job',
        label: startJobLabel,
        cta: () => {
          startJob(resource)
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
        accessReview: startJobAccessReview(resource),
      },
      ...pdbActions,
      ...commonActions,
    ],
    [pdbActions, resource, commonActions, navigate],
  );

  return [actions, !inFlight, undefined];
};
