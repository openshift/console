import i18next from 'i18next';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { JobModel } from '@console/internal/models';
import {
  k8sCreate,
  CronJobKind,
  JobKind,
  referenceFor,
  K8sResourceCommon,
} from '@console/internal/module/k8s';

export const startJob = (obj: CronJobKind): Promise<JobKind> => {
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

export const startJobLabel = i18next.t('console-app~Start Job');

export const startJobAccessReview = (obj: CronJobKind) => ({
  group: 'batch',
  resource: 'jobs',
  name: obj.metadata?.name,
  namespace: obj.metadata?.namespace,
  verb: 'create' as const,
});

export const getStartJobPath = (job: JobKind): string | null => {
  const path = resourceObjPath(job, referenceFor(job));
  return path || null;
};
