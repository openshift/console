import i18next from 'i18next';
import { history, resourceObjPath } from '@console/internal/components/utils';
import { JobModel } from '@console/internal/models';
import {
  K8sKind,
  k8sCreate,
  CronJobKind,
  JobKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { ResourceActionFactory } from './common-factory';

const startJob = (obj: CronJobKind): Promise<JobKind> => {
  const reqPayload = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: `${obj.metadata?.name}-${Date.now()}`,
      namespace: obj.metadata?.namespace,
      ownerReferences: [
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: obj.metadata?.name,
          uid: obj.metadata?.uid,
        },
      ],
    },
    spec: {
      template: obj.spec.jobTemplate.spec.template,
    },
  };

  return k8sCreate(JobModel, reqPayload);
};

export const CronJobActionFactory: ResourceActionFactory = {
  StartJob: (kind: K8sKind, obj: CronJobKind) => ({
    id: 'start-job',
    label: i18next.t('console-app~Start Job'),
    cta: () => {
      startJob(obj)
        .then((job) => history.push(resourceObjPath(job, referenceFor(job))))
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
