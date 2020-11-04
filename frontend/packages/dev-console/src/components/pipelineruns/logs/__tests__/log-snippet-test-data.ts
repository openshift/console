import { PipelineRun, TaskRunKind } from 'packages/dev-console/src/utils/pipeline-augment';

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

export const PipelineRunMock: PipelineRun[] = [
  {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'PipelineRun',
    metadata: {
      name: 'simple-pipeline-failed',
      namespace: 'tekton-pipelines',
    },
    spec: {
      pipelineRef: {
        name: 'simple-pipeline',
      },
    },
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
      startTime: '2019-10-29T11:56:40Z',
      taskRuns: {
        task1: {
          status: {
            startTime: '2019-10-29T11:57:53Z',
            completionTime: '2019-10-29T11:57:53Z',
            conditions: [
              {
                lastTransitionTime: '2019-10-29T11:57:53Z',
                reason: 'Succeeded',
                status: 'True',
                type: 'Succeeded',
              },
            ],
            podName: 'p1',
          },
          pipelineTaskName: 'task1',
        },
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'PipelineRun',
    metadata: {
      name: 'simple-pipeline-failed',
      namespace: 'tekton-pipelines',
    },
    spec: {
      pipelineRef: {
        name: 'simple-pipeline',
      },
    },
    status: {
      completionTime: '2019-10-29T11:57:53Z',
      conditions: [
        {
          lastTransitionTime: '2019-10-29T11:57:53Z',
          reason: 'Failed',
          status: 'False',
          type: 'Succeeded',
        },
      ],
      startTime: '2019-10-29T11:56:40Z',
      taskRuns: {
        task1: {
          status: {
            startTime: '2019-10-29T11:57:53Z',
            completionTime: '2019-10-29T11:57:53Z',
            conditions: [
              {
                lastTransitionTime: '2019-10-29T11:57:53Z',
                reason: 'Failed',
                status: 'False',
                type: 'Succeeded',
              },
            ],
            podName: 'pod1',
            steps: [
              {
                container: 'container1',
                imageID: 'a',
                name: 'step1',
                terminated: {
                  containerID: 'b',
                  exitCode: 1,
                  finishedAt: 'x',
                  reason: 'FAILED INTENTIONALLY',
                  startedAt: 'c',
                },
              },
            ],
          },
          pipelineTaskName: 'task1',
        },
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'PipelineRun',
    metadata: {
      name: 'simple-pipeline-failed-2',
      namespace: 'tekton-pipelines',
    },
    spec: {
      pipelineRef: {
        name: 'simple-pipeline',
      },
    },
    status: {
      completionTime: '2019-10-29T11:57:53Z',
      conditions: [
        {
          lastTransitionTime: '2019-10-29T11:57:53Z',
          reason: 'Failed',
          status: 'False',
          type: 'Succeeded',
        },
      ],
      startTime: '2019-10-29T11:56:40Z',
      taskRuns: {
        task1: {
          status: {
            startTime: '2019-10-29T11:57:53Z',
            completionTime: '2019-10-29T11:57:53Z',
            conditions: [
              {
                lastTransitionTime: '2019-10-29T11:57:53Z',
                reason: 'Failed',
                status: 'False',
                type: 'Succeeded',
              },
            ],
            podName: 'pod1',
          },
          pipelineTaskName: 'task1',
        },
      },
    },
  },
];
