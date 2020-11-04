import { TaskRunKind } from '../../../utils/pipeline-augment';

export const failedTaskRun: TaskRunKind = {
  kind: 'TaskRun',
  metadata: { name: 'abhi', namespace: 'abhi1' },
  status: {
    completionTime: '2019-10-29T11:57:53Z',
    conditions: [
      {
        lastTransitionTime: '2019-10-29T11:57:53Z',
        reason: 'Failed',
        status: 'True',
        type: 'Failed',
      },
    ],
  },
  spec: {},
};

export const successTaskRun: TaskRunKind = {
  kind: 'TaskRun',
  metadata: { name: 'abhi', namespace: 'abhi1' },
  status: {
    completionTime: '2019-10-29T11:57:53Z',
    conditions: [
      {
        lastTransitionTime: '2019-10-29T11:57:53Z',
        reason: 'Succeeded',
        status: 'True',
        type: 'Succeeded',
      },
    ],
  },
  spec: {},
};
