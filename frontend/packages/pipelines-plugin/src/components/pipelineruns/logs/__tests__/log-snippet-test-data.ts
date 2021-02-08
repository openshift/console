import { TaskRunKind } from '../../../../types';

export const LogSnippetTaskData: TaskRunKind[] = [
  {
    kind: 'TaskRun',
    metadata: { name: 'taskrun1-abhi', namespace: 'abhi' },
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
  },
  {
    kind: 'TaskRun',
    metadata: { name: 'taskrun1-abhi', namespace: 'abhi' },
    status: {
      podName: 'pod1',
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
  },
  {
    kind: 'TaskRun',
    metadata: { name: 'taskrun1-abhi', namespace: 'abhi' },
    status: {
      podName: 'pod1',
      completionTime: '2019-10-29T11:57:53Z',
      conditions: [
        {
          lastTransitionTime: '2019-10-29T11:57:53Z',
          reason: 'SUCCEEDED',
          status: 'True',
          type: 'SUCCEEDED',
        },
      ],
    },
    spec: {},
  },
];
