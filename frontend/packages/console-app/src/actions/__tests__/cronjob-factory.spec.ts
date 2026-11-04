import { CronJobModel, JobModel } from '@console/internal/models';
import { CronJobKind } from '@console/internal/module/k8s';
import { CronJobActionFactory } from '../creators/cronjob-factory';

const cronJob = {
  apiVersion: 'batch/v1',
  kind: 'CronJob',
  metadata: {
    name: 'test-cj',
    namespace: 'openshift-cluster-validation',
    uid: 'uid-1',
  },
} as CronJobKind;

describe('CronJob Start Job action', () => {
  it('authorizes create on jobs.batch for the CronJob namespace', () => {
    const action = CronJobActionFactory.StartJob(CronJobModel, cronJob);

    expect(action.accessReview).toEqual({
      group: JobModel.apiGroup,
      resource: JobModel.plural,
      name: 'test-cj',
      namespace: 'openshift-cluster-validation',
      verb: 'create',
    });
  });
});
