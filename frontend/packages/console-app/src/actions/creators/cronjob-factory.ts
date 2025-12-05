import i18next from 'i18next';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { history } from '@console/internal/components/utils/router';
import { JobModel } from '@console/internal/models';
import {
  K8sKind,
  k8sCreate,
  CronJobKind,
  JobKind,
  referenceFor,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import { ResourceActionFactory } from './types';

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

export const CronJobActionFactory: ResourceActionFactory = {
  StartJob: (kind: K8sKind, obj: CronJobKind) => ({
    id: 'start-job',
    label: i18next.t('console-app~Start Job'),
    cta: () => {
      startJob(obj)
        .then((job) => {
          const path = resourceObjPath(job, referenceFor(job));
          if (path) {
            history.push(path);
          }
        })
        .catch((error) => {
          // TODO: Show error in notification in the follow on tech-debt.
          // eslint-disable-next-line no-console
          console.error('Failed to start a Job.', error);
        });
    },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata?.name,
      namespace: obj.metadata?.namespace,
      verb: 'create',
    },
  }),
};
