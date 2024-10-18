import i18next from 'i18next';
import { history } from '@console/internal/components/utils';
import { JobModel } from '@console/internal/models';
import { K8sKind, k8sCreate, CronJobKind, JobKind } from '@console/internal/module/k8s';
import { ResourceActionFactory } from './common-factory';

const generateJobName = (objName: string): string => `${objName}-${Date.now()}`;

const jobDetailsURL = (objNamespace: string, jobName: string): string =>
  `/k8s/ns/${objNamespace}/jobs/${jobName}`;

const startJob = (obj: CronJobKind, jobName: string): Promise<JobKind> => {
  const { name, namespace, uid } = obj.metadata;
  const reqPayload = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName,
      namespace,
      ownerReferences: [
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name,
          uid,
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
      const jobName = generateJobName(obj.metadata.name);
      startJob(obj, jobName)
        .then(() => {
          history.push(jobDetailsURL(obj.metadata.namespace, jobName));
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
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'create',
    },
  }),
};
