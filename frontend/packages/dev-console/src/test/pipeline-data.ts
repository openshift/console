import { K8sResourceKind } from '@console/internal/module/k8s';
import { Pipeline, PipelineRun, TaskRunKind } from '../utils/pipeline-augment';

export enum DataState {
  IN_PROGRESS = 'In Progress',
  SUCCESS = 'Completed Successfully',
  CANCELLED1 = 'Cancelled at stage1',
  CANCELLED2 = 'Cancelled at stage2 paralell task',
  CANCELLED3 = 'Cancelled at stage3 single task',
  FAILED1 = 'Failed at stage1',
  FAILED2 = 'Failed at stage 2',
  FAILED3 = 'Failed at stage 3',
  FAILED_BUT_COMPLETE = 'Completed But Failed',
}

export enum PipelineExampleNames {
  COMPLEX_PIPELINE = 'complex-pipeline',
  PARTIAL_PIPELINE = 'partial-pipeline',
  SIMPLE_PIPELINE = 'simple-pipeline',
  CLUSTER_PIPELINE = 'cluster-pipeline',
  BROKEN_MOCK_APP = 'broken-mock-app',
  WORKSPACE_PIPELINE = 'workspace-pipeline',
  INVALID_PIPELINE_MISSING_TASK = 'missing-task-pipeline',
  INVALID_PIPELINE_INVALID_TASK = 'invalid-task-pipeline',
}

type CombinedPipelineTestData = {
  dataSource: string; // where the data was sourced from
  pipeline: Pipeline;
  pipelineRuns: { [key in DataState]?: PipelineRun };
  taskRuns?: TaskRunKind[];
  pods?: K8sResourceKind[];
  // esLint seems to be having issues detecting the usage above - but typescript is properly typing the value
  eslint_workaround?: PipelineRun;
};

type PipelineTestData = { [key in PipelineExampleNames]?: CombinedPipelineTestData };

export const pipelineTestData: PipelineTestData = {
  [PipelineExampleNames.SIMPLE_PIPELINE]: {
    dataSource: 'simple-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        name: 'simple-pipeline',
        namespace: 'tekton-pipelines',
      },
      spec: {
        tasks: [
          {
            name: 'hello-world-1',
            taskRef: { name: 'hello-world-1' },
          },
          {
            name: 'hello-world-truncate-more-than-20-char',
            taskRef: { name: 'hello-world-truncate-more-than-20-char' },
          },
        ],
      },
    },
    pipelineRuns: {
      [DataState.IN_PROGRESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'simple-pipeline-br8cxv',
          namespace: 'tekton-pipelines',
        },
        spec: {
          pipelineRef: { name: 'simple-pipeline' },
          resources: [
            { name: 'source-repo', resourceRef: { name: 'mapit-git' } },
            { name: 'web-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2019-09-12T20:38:01Z',
              message: 'All Tasks have completed executing',
              reason: 'Succeeded',
              status: '',
              type: 'Running',
            },
          ],
          taskRuns: {
            'simple-pipeline-br8cxv-hello-world-1-vqkzl': {
              pipelineTaskName: 'hello-world-1',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'Unknown', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-br8cxv-hello-world-truncate-more-than-20--87v4h': {
              pipelineTaskName: 'hello-world-truncate-more-than-20-char',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'Unknown', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
          },
        },
      },
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'simple-pipeline-p1bun0',
          namespace: 'tekton-pipelines',
        },
        spec: {
          pipelineRef: { name: 'simple-pipeline' },
          resources: [
            { name: 'source-repo', resourceRef: { name: 'mapit-git' } },
            {
              name: 'web-image',
              resourceRef: { name: 'mapit-image' },
            },
          ],
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2019-09-12T20:38:01Z',
              message: 'All Tasks have completed executing',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          taskRuns: {
            'simple-pipeline-p1bun0-hello-world-1-rlj9b': {
              pipelineTaskName: 'hello-world-1',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-p1bun0-hello-world-truncate-more-than-20--cnd82': {
              pipelineTaskName: 'hello-world-truncate-more-than-20-char',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.PARTIAL_PIPELINE]: {
    dataSource: 'partial-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        name: 'partial-pipeline',
        namespace: 'tekton-pipelines',
      },
      spec: {
        tasks: [
          { name: 'hello-world-1', taskRef: { name: 'hello-world-1' } },
          {
            name: 'hello-world-truncate-more-than-20-char',
            taskRef: { name: 'hello-world-truncate-more-than-20-char' },
          },
          { name: 'hello-world-3', taskRef: { name: 'hello-world-3' } },
        ],
      },
    },
    pipelineRuns: {
      [DataState.FAILED_BUT_COMPLETE]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'partial-pipeline-3tt7aw',
          namespace: 'tekton-pipelines',
        },
        spec: {
          pipelineRef: { name: 'partial-pipeline' },
        },
        status: {
          conditions: [
            {
              status: 'False',
              type: 'Succeeded',
            },
          ],
        },
      },
    },
  },
  [PipelineExampleNames.COMPLEX_PIPELINE]: {
    dataSource: 'complex-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        name: 'complex-pipeline',
        namespace: 'tekton-pipelines',
      },
      spec: {
        tasks: [
          { name: 'build-app', taskRef: { name: 'noop-task' } },
          { name: 'analyse-code', runAfter: ['build-app'], taskRef: { name: 'noop-task' } },
          { name: 'style-checks', runAfter: ['build-app'], taskRef: { name: 'noop-task' } },
          { name: 'find-bugs', runAfter: ['build-app'], taskRef: { name: 'noop-task' } },
          {
            name: 'build-image',
            runAfter: ['find-bugs', 'style-checks', 'analyse-code'],
            taskRef: { name: 'noop-task' },
          },
          { name: 'deploy-image', runAfter: ['build-image'], taskRef: { name: 'noop-task' } },
          { name: 'test-suite-1', runAfter: ['deploy-image'], taskRef: { name: 'noop-task' } },
          { name: 'test-suite-2', runAfter: ['deploy-image'], taskRef: { name: 'noop-task' } },
          { name: 'test-suite-3', runAfter: ['deploy-image'], taskRef: { name: 'noop-task' } },
          { name: 'test-suite-4', runAfter: ['deploy-image'], taskRef: { name: 'noop-task' } },
          { name: 'test-suite-5', runAfter: ['deploy-image'], taskRef: { name: 'noop-task' } },
          { name: 'test-suite-6', runAfter: ['deploy-image'], taskRef: { name: 'noop-task' } },
          {
            name: 'verify',
            runAfter: [
              'test-suite-1',
              'test-suite-2',
              'test-suite-3',
              'test-suite-4',
              'test-suite-5',
              'test-suite-6',
            ],
            taskRef: { name: 'noop-task' },
          },
        ],
      },
    },
    pipelineRuns: {
      [DataState.CANCELLED1]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
          status: 'PipelineRunCancelled',
        },
        status: {
          conditions: [
            {
              reason: 'PipelineRunCancelled',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          taskRuns: {
            'complex-pipeline-fm4hax-build-app-gpq78': {
              pipelineTaskName: 'build-app',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
          },
        },
      },
      [DataState.FAILED1]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          conditions: [
            {
              status: 'False',
              type: 'Succeeded',
            },
          ],
          taskRuns: {
            'complex-pipeline-fm4hax-build-app-gpq78': {
              pipelineTaskName: 'build-app',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'False', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
          },
        },
      },
      [DataState.CANCELLED2]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
          status: 'PipelineRunCancelled',
        },
        status: {
          conditions: [
            {
              reason: 'PipelineRunCancelled',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2019-12-09T08:59:05Z',
          taskRuns: {
            'simple-pipeline-7ergyh-build-1-cht9h': {
              pipelineTaskName: 'build-1',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-7ergyh-build-2-x8jq2': {
              pipelineTaskName: 'build-2',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-7ergyh-push-n2r2q': {
              pipelineTaskName: 'push',
              status: {
                completionTime: '2019-12-09T08:59:26Z',
                conditions: [
                  {
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
          },
        },
      },
      [DataState.FAILED2]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          conditions: [
            {
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2019-12-09T08:59:05Z',
          taskRuns: {
            'simple-pipeline-7ergyh-build-1-cht9h': {
              pipelineTaskName: 'build-1',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-7ergyh-build-2-x8jq2': {
              pipelineTaskName: 'build-2',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-7ergyh-push-n2r2q': {
              pipelineTaskName: 'push',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'False', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
          },
        },
      },
      [DataState.FAILED3]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          conditions: [
            {
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2019-12-10T11:18:38Z',
          taskRuns: {
            'simple-pipeline-haeml4-build-1-fddrb': {
              pipelineTaskName: 'build-1',
              status: {
                completionTime: '2019-12-10T11:19:18Z',
                conditions: [
                  {
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'simple-pipeline-haeml4-build-2-l5scg': {
              pipelineTaskName: 'build-2',
              status: {
                completionTime: '2019-12-10T11:19:19Z',
                conditions: [
                  {
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'simple-pipeline-haeml4-deploy-qtpnz': {
              pipelineTaskName: 'deploy',
              status: {
                completionTime: '2019-12-10T11:19:19Z',
                conditions: [
                  {
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'simple-pipeline-haeml4-push-4gj8n': {
              pipelineTaskName: 'push',
              status: {
                completionTime: '2019-12-10T11:18:58Z',
                conditions: [
                  {
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
          },
        },
      },
      [DataState.CANCELLED3]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
          status: 'PipelineRunCancelled',
        },
        status: {
          conditions: [
            {
              reason: 'PipelineRunCancelled',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2019-12-10T11:18:38Z',
          taskRuns: {
            'simple-pipeline-haeml4-build-1-fddrb': {
              pipelineTaskName: 'build-1',
              status: {
                completionTime: '2019-12-10T11:19:18Z',
                conditions: [
                  {
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'simple-pipeline-haeml4-build-2-l5scg': {
              pipelineTaskName: 'build-2',
              status: {
                completionTime: '2019-12-10T11:19:19Z',
                conditions: [
                  {
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                startTime: '2019-12-10T11:18:58Z',
                podName: 'test',
              },
            },
            'simple-pipeline-haeml4-deploy-qtpnz': {
              pipelineTaskName: 'deploy',
              status: {
                conditions: [
                  {
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'simple-pipeline-haeml4-push-4gj8n': {
              pipelineTaskName: 'push',
              status: {
                completionTime: '2019-12-10T11:18:58Z',
                conditions: [
                  {
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
          },
        },
      },
      [DataState.IN_PROGRESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-6w9np2',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          taskRuns: {
            'complex-pipeline-6w9np2-build-app-6gkss': {
              pipelineTaskName: 'build-app',
              status: {
                conditions: [{ status: 'Unknown', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
          },
        },
      },
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-6w9np2',
          namespace: 'tekton-pipelines',
        },
        spec: {
          params: [{ name: 'APP_NAME', value: '' }],
          pipelineRef: { name: 'complex-pipeline' },
          resources: [
            { name: 'app-git', resourceRef: { name: 'mapit-git' } },
            { name: 'app-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          taskRuns: {
            'complex-pipeline-6w9np2-test-suite-3-kh8pz': {
              pipelineTaskName: 'test-suite-3',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-test-suite-5-2l8ms': {
              pipelineTaskName: 'test-suite-5',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-deploy-image-vrmcf': {
              pipelineTaskName: 'deploy-image',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-build-app-6gkss': {
              pipelineTaskName: 'build-app',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-build-image-rkctm': {
              pipelineTaskName: 'build-image',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-verify-6djz9': {
              pipelineTaskName: 'verify',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-test-suite-2-88mk2': {
              pipelineTaskName: 'test-suite-2',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-test-suite-4-xqk5x': {
              pipelineTaskName: 'test-suite-4',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-test-suite-6-hvd6w': {
              pipelineTaskName: 'test-suite-6',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-test-suite-1-9bddh': {
              pipelineTaskName: 'test-suite-1',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-analyse-code-wrx7t': {
              pipelineTaskName: 'analyse-code',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-find-bugs-zqsdf': {
              pipelineTaskName: 'find-bugs',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
            'complex-pipeline-6w9np2-style-checks-d9s6v': {
              pipelineTaskName: 'style-checks',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:58Z',
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.CLUSTER_PIPELINE]: {
    dataSource: 'cluster-mock-app-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        creationTimestamp: '2019-11-22T14:58:02Z',
        generation: 1,
        labels: { 'pipeline.openshift.io/runtime': 'modern-webapp' },
        name: 'cluster-mock-app-pipeline',
        namespace: 'openshift',
        resourceVersion: '672093',
        selfLink:
          '/apis/tekton.dev/v1alpha1/namespaces/openshift/pipelines/cluster-mock-app-pipeline',
        uid: 'd22b9451-cd71-47f3-be1a-4ca93647b76e',
      },
      spec: {
        tasks: [
          {
            name: 'install-deps',
            taskRef: { kind: 'ClusterTask', name: 'cluster-install-dependencies' },
          },
          {
            name: 'code-sanity',
            runAfter: ['install-deps'],
            taskRef: { kind: 'ClusterTask', name: 'cluster-lint-and-test' },
          },
          {
            name: 'compile',
            runAfter: ['install-deps'],
            taskRef: { kind: 'ClusterTask', name: 'cluster-build-dist' },
          },
          {
            name: 'e2e-tests',
            runAfter: ['code-sanity', 'compile'],
            taskRef: { kind: 'ClusterTask', name: 'cluster-run-e2e-tests' },
          },
        ],
      },
    },
    pipelineRuns: {
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          creationTimestamp: '2019-11-22T15:20:42Z',
          generation: 1,
          labels: {
            'app.kubernetes.io/instance': 'react-web-app',
            'pipeline.openshift.io/runtime': 'modern-webapp',
            'tekton.dev/pipeline': 'react-web-app-cluster-mock-app-pipeline',
          },
          name: 'react-web-app-cluster-mock-app-pipeline-aaz5bv',
          namespace: 'andrew-test',
          resourceVersion: '677828',
          selfLink:
            '/apis/tekton.dev/v1alpha1/namespaces/andrew-test/pipelineruns/react-web-app-cluster-mock-app-pipeline-aaz5bv',
          uid: 'd067dfb0-dc9d-49b2-a998-c93636c50b7d',
        },
        spec: {
          pipelineRef: { name: 'react-web-app-cluster-mock-app-pipeline' },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2019-11-22T15:21:55Z',
          conditions: [
            {
              lastTransitionTime: '2019-11-22T15:21:55Z',
              message: 'All Tasks have completed executing',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          startTime: '2019-11-22T15:20:42Z',
          taskRuns: {
            'react-web-app-cluster-mock-app-pipeline-aaz5bv-code-sanit-rwxxs': {
              pipelineTaskName: 'code-sanity',
              status: {
                completionTime: '2019-11-22T15:21:42Z',
                conditions: [
                  {
                    lastTransitionTime: '2019-11-22T15:21:42Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName:
                  'react-web-app-cluster-mock-app-pipeline-aaz5bv-code-sanit-rwxxs-pod-3ed59b',
                startTime: '2019-11-22T15:21:07Z',
                steps: [
                  {
                    container: 'step-startup',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'startup',
                    terminated: {
                      containerID:
                        'cri-o://8220163fc267292c4078efc8819382acdfacbf3eb7abaabe17c4ca2dc75560a0',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:40Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:32Z',
                    },
                  },
                  {
                    container: 'step-lint-errors',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'lint-errors',
                    terminated: {
                      containerID:
                        'cri-o://f10383bd1035fc4fdea7d9735ced5e3e59ebd6f997973e67778f83c230cb3eb6',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:41Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:33Z',
                    },
                  },
                  {
                    container: 'step-test-status',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'test-status',
                    terminated: {
                      containerID:
                        'cri-o://672713bc306144292740b2d2239812d09ad3721c19f83d655ced0929f26b291e',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:41Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:37Z',
                    },
                  },
                  {
                    container: 'step-coverage-report',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'coverage-report',
                    terminated: {
                      containerID:
                        'cri-o://266f9d00e752b08287f8bacc5e7a94db2b0a54594370939c5fdd231aae9435c5',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:42Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:38Z',
                    },
                  },
                ],
              },
            },
            'react-web-app-cluster-mock-app-pipeline-aaz5bv-compile-f72vg': {
              pipelineTaskName: 'compile',
              status: {
                completionTime: '2019-11-22T15:21:33Z',
                conditions: [
                  {
                    lastTransitionTime: '2019-11-22T15:21:33Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'react-web-app-cluster-mock-app-pipeline-aaz5bv-compile-f72vg-pod-333c08',
                startTime: '2019-11-22T15:21:07Z',
                steps: [
                  {
                    container: 'step-build',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'build',
                    terminated: {
                      containerID:
                        'cri-o://9eccce1fd21657ed9e845473219e9ef26e08bca99eb8ec8bccfaee40fa6e6552',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:33Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:32Z',
                    },
                  },
                ],
              },
            },
            'react-web-app-cluster-mock-app-pipeline-aaz5bv-e2e-tests-qxhbm': {
              pipelineTaskName: 'e2e-tests',
              status: {
                completionTime: '2019-11-22T15:21:55Z',
                conditions: [
                  {
                    lastTransitionTime: '2019-11-22T15:21:55Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName:
                  'react-web-app-cluster-mock-app-pipeline-aaz5bv-e2e-tests-qxhbm-pod-5e9fbe',
                startTime: '2019-11-22T15:21:43Z',
                steps: [
                  {
                    container: 'step-status',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'status',
                    terminated: {
                      containerID:
                        'cri-o://d982fe1da934aba0e6ed52e85cd40daf92d7d3c5a2d534512a84ab7c52230aae',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:55Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:53Z',
                    },
                  },
                ],
              },
            },
            'react-web-app-cluster-mock-app-pipeline-aaz5bv-install-de-8bh7s': {
              pipelineTaskName: 'install-deps',
              status: {
                completionTime: '2019-11-22T15:21:07Z',
                conditions: [
                  {
                    lastTransitionTime: '2019-11-22T15:21:07Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName:
                  'react-web-app-cluster-mock-app-pipeline-aaz5bv-install-de-8bh7s-pod-7e9f9b',
                startTime: '2019-11-22T15:20:42Z',
                steps: [
                  {
                    container: 'step-install',
                    imageID:
                      'docker.io/library/ubuntu@sha256:134c7fe821b9d359490cd009ce7ca322453f4f2d018623f849e580a89a685e5d',
                    name: 'install',
                    terminated: {
                      containerID:
                        'cri-o://916e83acefad66681639c221f2bbe77615744a987b41a2dcfc2e41d387359275',
                      exitCode: 0,
                      finishedAt: '2019-11-22T15:21:07Z',
                      reason: 'Completed',
                      startedAt: '2019-11-22T15:21:06Z',
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.BROKEN_MOCK_APP]: {
    dataSource: 'broken-app',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'broken-app-pipeline',
      },
      spec: {
        tasks: [
          {
            name: 'install-deps',
            taskRef: {
              kind: 'Task',
              name: 'install-dependencies-2',
            },
          },
          {
            name: 'code-sanity',
            runAfter: ['install-deps'],
            taskRef: {
              kind: 'Task',
              name: 'lint-and-test-2',
            },
          },
          {
            name: 'x-compile',
            runAfter: ['install-deps'],
            taskRef: {
              kind: 'Task',
              name: 'build-dist-2',
            },
          },
          {
            name: 'e2e-tests',
            runAfter: ['code-sanity', 'x-compile'],
            taskRef: {
              kind: 'Task',
              name: 'run-e2e-tests-2',
            },
          },
        ],
      },
    },
    pipelineRuns: {
      [DataState.FAILED1]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'broken-app-pipeline-j2nxzm',
          labels: {
            'pipeline.openshift.io/started-by': 'kubeadmin',
            'tekton.dev/pipeline': 'broken-app-pipeline',
          },
        },
        spec: {
          pipelineRef: {
            name: 'broken-app-pipeline',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2020-07-13T17:22:41Z',
          conditions: [
            {
              lastTransitionTime: '2020-07-13T17:22:07Z',
              message: 'TaskRun broken-app-pipeline-j2nxzm-x-compile-8mq2h has failed',
              reason: 'Failed',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2020-07-13T17:21:48Z',
          taskRuns: {
            'broken-app-pipeline-j2nxzm-code-sanity-7mxhc': {
              pipelineTaskName: 'code-sanity',
              status: {
                completionTime: '2020-07-13T17:22:41Z',
                conditions: [
                  {
                    lastTransitionTime: '2020-07-13T17:22:41Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'broken-app-pipeline-j2nxzm-code-sanity-7mxhc-pod-qj8vn',
                startTime: '2020-07-13T17:21:57Z',
                steps: [
                  {
                    container: 'step-startup',
                    imageID:
                      'docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47',
                    name: 'startup',
                    terminated: {
                      containerID:
                        'cri-o://4ef0ccd72c8efeb941c98ca5d50e1ae03b8ad8f4b67eaf0dc66a1352bd0557e9',
                      exitCode: 0,
                      finishedAt: '2020-07-13T17:22:41Z',
                      reason: 'Completed',
                      startedAt: '2020-07-13T17:22:41Z',
                    },
                  },
                  {
                    container: 'step-lint-errors',
                    imageID:
                      'docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47',
                    name: 'lint-errors',
                    terminated: {
                      containerID:
                        'cri-o://a87ebbad25fbf952ceb1d61a83fdb6328cd5dead76b4456bbc43a2f71b0eb73f',
                      exitCode: 0,
                      finishedAt: '2020-07-13T17:22:41Z',
                      reason: 'Completed',
                      startedAt: '2020-07-13T17:22:41Z',
                    },
                  },
                  {
                    container: 'step-test-status',
                    imageID:
                      'docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47',
                    name: 'test-status',
                    terminated: {
                      containerID:
                        'cri-o://1801d31b66b1862f860947bc183cb73961e701590496df93cd853c2d3e93f584',
                      exitCode: 0,
                      finishedAt: '2020-07-13T17:22:41Z',
                      reason: 'Completed',
                      startedAt: '2020-07-13T17:22:41Z',
                    },
                  },
                  {
                    container: 'step-coverage-report',
                    imageID:
                      'docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47',
                    name: 'coverage-report',
                    terminated: {
                      containerID:
                        'cri-o://70a603725651d5078ed2935ea796a0e515aba3920c09f4128b87e792a2b45184',
                      exitCode: 0,
                      finishedAt: '2020-07-13T17:22:41Z',
                      reason: 'Completed',
                      startedAt: '2020-07-13T17:22:41Z',
                    },
                  },
                ],
              },
            },
            'broken-app-pipeline-j2nxzm-install-deps-x5z4w': {
              pipelineTaskName: 'install-deps',
              status: {
                completionTime: '2020-07-13T17:21:57Z',
                conditions: [
                  {
                    lastTransitionTime: '2020-07-13T17:21:57Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'broken-app-pipeline-j2nxzm-install-deps-x5z4w-pod-ff5ng',
                startTime: '2020-07-13T17:21:48Z',
                steps: [
                  {
                    container: 'step-install',
                    imageID:
                      'docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47',
                    name: 'install',
                    terminated: {
                      containerID:
                        'cri-o://3f32a3a4d39c4bf44fcf63423c2db8942362584a79f4306e458d7ffd7bec814f',
                      exitCode: 0,
                      finishedAt: '2020-07-13T17:21:57Z',
                      reason: 'Completed',
                      startedAt: '2020-07-13T17:21:57Z',
                    },
                  },
                ],
              },
            },
            'broken-app-pipeline-j2nxzm-x-compile-8mq2h': {
              pipelineTaskName: 'x-compile',
              status: {
                completionTime: '2020-07-13T17:22:07Z',
                conditions: [
                  {
                    lastTransitionTime: '2020-07-13T17:22:07Z',
                    message:
                      '"step-build" exited with code 1 (image: "docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47"); for logs run: kubectl -n andrew logs broken-app-pipeline-j2nxzm-x-compile-8mq2h-pod-b9gsg -c step-build',
                    reason: 'Failed',
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
                podName: 'broken-app-pipeline-j2nxzm-x-compile-8mq2h-pod-b9gsg',
                startTime: '2020-07-13T17:21:57Z',
                steps: [
                  {
                    container: 'step-build',
                    imageID:
                      'docker.io/library/ubuntu@sha256:55cd38b70425947db71112eb5dddfa3aa3e3ce307754a3df2269069d2278ce47',
                    name: 'build',
                    terminated: {
                      containerID:
                        'cri-o://106cbbd7bc050353844377811de44def18fd5895ab42cc64b1aeef361884d310',
                      exitCode: 1,
                      finishedAt: '2020-07-13T17:22:07Z',
                      reason: 'Error',
                      startedAt: '2020-07-13T17:22:07Z',
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.INVALID_PIPELINE_MISSING_TASK]: {
    dataSource: 'missing-task-reference',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'task-ref-error',
      },
      spec: {
        tasks: [{ name: 'build-dist', taskRef: { kind: 'Task', name: 'not-a-task' } }],
      },
    },
    pipelineRuns: {
      [DataState.FAILED1]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'task-ref-error-7f2iv4',
          labels: {
            'pipeline.openshift.io/started-by': 'kubeadmin',
            'tekton.dev/pipeline': 'task-ref-error',
          },
        },
        spec: {
          pipelineRef: {
            name: 'task-ref-error',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2020-07-13T17:21:05Z',
          conditions: [
            {
              lastTransitionTime: '2020-07-13T17:21:05Z',
              message:
                'Pipeline andrew/task-ref-error can\'t be Run; it contains Tasks that don\'t exist: Couldn\'t retrieve Task "not-a-task": task.tekton.dev "not-a-task" not found',
              reason: 'CouldntGetTask',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2020-07-13T17:21:05Z',
        },
      },
    },
  },
  [PipelineExampleNames.INVALID_PIPELINE_INVALID_TASK]: {
    dataSource: 'git-clone-without-workspace',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'new-pipeline',
      },
      spec: {
        tasks: [
          {
            name: 'git-clone',
            params: [
              {
                name: 'url',
                value: 'https://github.com/nodeshift-starters/nodejs-rest-http',
              },
              {
                name: 'revision',
                value: 'master',
              },
              {
                name: 'submodules',
                value: 'true',
              },
              {
                name: 'depth',
                value: '1',
              },
              {
                name: 'sslVerify',
                value: 'true',
              },
              {
                name: 'deleteExisting',
                value: 'false',
              },
            ],
            taskRef: {
              kind: 'ClusterTask',
              name: 'git-clone',
            },
          },
        ],
      },
    },
    pipelineRuns: {
      [DataState.FAILED1]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'new-pipeline-oxxhj5',
          labels: {
            'pipeline.openshift.io/started-by': 'kubeadmin',
            'tekton.dev/pipeline': 'new-pipeline',
          },
        },
        spec: {
          pipelineRef: {
            name: 'new-pipeline',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2020-07-13T17:16:28Z',
          conditions: [
            {
              lastTransitionTime: '2020-07-13T17:16:28Z',
              message: 'TaskRun new-pipeline-oxxhj5-git-clone-pwmmj has failed',
              reason: 'Failed',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          startTime: '2020-07-13T17:16:28Z',
          taskRuns: {
            'new-pipeline-oxxhj5-git-clone-pwmmj': {
              pipelineTaskName: 'git-clone',
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2020-07-13T17:16:28Z',
                    message:
                      "bound workspaces did not match declared workspaces: didn't provide required values: [output]",
                    reason: 'TaskRunValidationFailed',
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
                podName: '',
                startTime: '2020-07-13T17:16:28Z',
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.WORKSPACE_PIPELINE]: {
    dataSource: 'workspace-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'fetch-and-print-recipe',
        uid: 'c59a2137-05ec-4909-8d2b-0baea237210b',
      },
      spec: {
        tasks: [
          {
            name: 'fetch-the-recipe',
            taskRef: {
              kind: 'Task',
              name: 'fetch-secure-data',
            },
            workspaces: [
              {
                name: 'super-secret-password',
                workspace: 'password-vault',
              },
              {
                name: 'secure-store',
                workspace: 'recipe-store',
              },
              {
                name: 'filedrop',
                workspace: 'shared-data',
              },
            ],
          },
          {
            name: 'print-the-recipe',
            params: [
              {
                name: 'filename',
                value: 'recipe.txt',
              },
            ],
            runAfter: ['fetch-the-recipe'],
            taskRef: {
              kind: 'Task',
              name: 'print-data',
            },
            workspaces: [
              {
                name: 'storage',
                workspace: 'shared-data',
              },
            ],
          },
        ],
        workspaces: [
          {
            name: 'password-vault',
          },
          {
            name: 'recipe-store',
          },
          {
            name: 'shared-data',
          },
        ],
      },
    },
    pipelineRuns: {
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'fetch-and-print-recipe-sn3peo',
          uid: '32d3051a-148d-4a35-9969-4c2152691342',
          labels: {
            'tekton.dev/pipeline': 'fetch-and-print-recipe',
          },
        },
        spec: {
          pipelineRef: {
            name: 'fetch-and-print-recipe',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
          workspaces: [
            {
              name: 'password-vault',
              secret: {
                secretName: 'secret-password',
              },
            },
            {
              configMap: {
                items: [
                  {
                    key: 'brownies',
                    path: 'recipe.txt',
                  },
                ],
                name: 'sensitive-recipe-storage',
              },
              name: 'recipe-store',
            },
            {
              name: 'shared-data',
              persistentVolumeClaim: {
                claimName: 'shared-task-storage',
              },
            },
          ],
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2020-10-07T07:36:01Z',
              message: 'Tasks Completed: 2 (Failed: 0, Cancelled 0), Skipped: 0',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          taskRuns: {
            'fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw': {
              pipelineTaskName: 'fetch-the-recipe',

              status: {
                startTime: '2020-10-07T07:35:40Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw-pod-tqk4l',
              },
            },
            'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj': {
              pipelineTaskName: 'print-the-recipe',
              status: {
                startTime: '2020-10-07T07:36:01Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj-pod-w9724',
              },
            },
          },
        },
      },
    },
    taskRuns: [
      {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: {
          name: 'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj',
          uid: 'a55e0e4c-99ea-4c44-9f61-de63bbd49d95',
          namespace: 'karthik',
          ownerReferences: [
            {
              apiVersion: 'tekton.dev/v1beta1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'PipelineRun',
              name: 'fetch-and-print-recipe-sn3peo',
              uid: '32d3051a-148d-4a35-9969-4c2152691342',
            },
          ],
          labels: {
            'app.kubernetes.io/managed-by': 'tekton-pipelines',
            'tekton.dev/pipeline': 'fetch-and-print-recipe',
            'tekton.dev/pipelineRun': 'fetch-and-print-recipe-sn3peo',
            'tekton.dev/pipelineTask': 'print-the-recipe',
            'tekton.dev/task': 'print-data',
          },
        },
        spec: {
          params: [
            {
              name: 'filename',
              value: 'recipe.txt',
            },
          ],
          serviceAccountName: 'pipeline',
          taskRef: {
            kind: 'Task',
            name: 'print-data',
          },
          timeout: '1h0m0s',
          workspaces: [
            {
              name: 'storage',
              persistentVolumeClaim: {
                claimName: 'shared-task-storage',
              },
            },
          ],
        },
        status: {
          completionTime: '2020-10-07T07:36:01Z',
          podName: 'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj-pod-w9724',
          startTime: '2020-10-07T07:35:40Z',
        },
      },
      {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: {
          annotations: {
            'kubectl.kubernetes.io/last-applied-configuration':
              '{"apiVersion":"tekton.dev/v1beta1","kind":"Task","metadata":{"annotations":{},"name":"fetch-secure-data","namespace":"karthik"},"spec":{"steps":[{"image":"ubuntu","name":"fetch-and-write","script":"if [ \\"hunter2\\" = \\"$(cat $(workspaces.super-secret-password.path)/password)\\" ]; then\\n  cp $(workspaces.secure-store.path)/recipe.txt $(workspaces.filedrop.path)\\nelse\\n  echo \\"wrong password!\\"\\n  exit 1\\nfi\\n"}],"workspaces":[{"name":"super-secret-password"},{"name":"secure-store"},{"name":"filedrop"}]}}\n',
            'pipeline.tekton.dev/release': 'devel',
          },
          selfLink:
            '/apis/tekton.dev/v1beta1/namespaces/karthik/taskruns/fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw',
          resourceVersion: '527180',
          name: 'fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw',
          uid: '8eab0635-3d63-4f5b-b1a5-48bc6f2fab60',
          creationTimestamp: '2020-10-07T07:35:15Z',
          generation: 1,
          namespace: 'karthik',
          ownerReferences: [
            {
              apiVersion: 'tekton.dev/v1beta1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'PipelineRun',
              name: 'fetch-and-print-recipe-sn3peo',
              uid: '32d3051a-148d-4a35-9969-4c2152691342',
            },
          ],
          labels: {
            'app.kubernetes.io/managed-by': 'tekton-pipelines',
            'tekton.dev/pipeline': 'fetch-and-print-recipe',
            'tekton.dev/pipelineRun': 'fetch-and-print-recipe-sn3peo',
            'tekton.dev/pipelineTask': 'fetch-the-recipe',
            'tekton.dev/task': 'fetch-secure-data',
          },
        },
        spec: {},
        status: {},
      },
    ],
    pods: [
      {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj-pod-w9724',
          uid: 'd114c023-19db-40b9-91f9-e7bc632e2e5c',
          namespace: 'karthik',
          ownerReferences: [
            {
              apiVersion: 'tekton.dev/v1beta1',
              kind: 'TaskRun',
              name: 'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj',
              uid: 'a55e0e4c-99ea-4c44-9f61-de63bbd49d95',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            'app.kubernetes.io/managed-by': 'tekton-pipelines',
            'tekton.dev/pipeline': 'fetch-and-print-recipe',
            'tekton.dev/pipelineRun': 'fetch-and-print-recipe-sn3peo',
            'tekton.dev/pipelineTask': 'print-the-recipe',
            'tekton.dev/task': 'print-data',
            'tekton.dev/taskRun': 'fetch-and-print-recipe-sn3peo-print-the-recipe-cbwbj',
          },
        },
        spec: {},
        status: {},
      },
      {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw-pod-tqk4l',
          uid: 'a12cdab2-a179-48ff-9e86-9b2b67de7d4c',
          namespace: 'karthik',
          ownerReferences: [
            {
              apiVersion: 'tekton.dev/v1beta1',
              kind: 'TaskRun',
              name: 'fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw',
              uid: '8eab0635-3d63-4f5b-b1a5-48bc6f2fab60',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            'app.kubernetes.io/managed-by': 'tekton-pipelines',
            'tekton.dev/pipeline': 'fetch-and-print-recipe',
            'tekton.dev/pipelineRun': 'fetch-and-print-recipe-sn3peo',
            'tekton.dev/pipelineTask': 'fetch-the-recipe',
            'tekton.dev/task': 'fetch-secure-data',
            'tekton.dev/taskRun': 'fetch-and-print-recipe-sn3peo-fetch-the-recipe-2rjgw',
          },
        },
        spec: {},
        status: {},
      },
    ],
  },
};

export const taskTestData = {
  v1alpha1: {
    buildah: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'ClusterTask',
      metadata: {
        name: 'buildah',
      },
      spec: {
        inputs: {
          params: [
            {
              default: 'quay.io/buildah/stable:v1.11.0',
              description: 'The location of the buildah builder image.',
              name: 'BUILDER_IMAGE',
              type: 'string',
            },
            {
              default: './Dockerfile',
              description: 'Path to the Dockerfile to build.',
              name: 'DOCKERFILE',
              type: 'string',
            },
          ],
          resources: [
            {
              name: 'source',
              type: 'git',
            },
          ],
        },
        outputs: {
          resources: [
            {
              name: 'image',
              type: 'image',
            },
          ],
        },
        steps: [],
      },
    },
  },
  v1beta1: {
    buildah: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'ClusterTask',
      metadata: {
        name: 'buildah',
      },
      spec: {
        params: [
          {
            default: 'quay.io/buildah/stable:v1.11.0',
            description: 'The location of the buildah builder image.',
            name: 'BUILDER_IMAGE',
            type: 'string',
          },
          {
            default: './Dockerfile',
            description: 'Path to the Dockerfile to build.',
            name: 'DOCKERFILE',
            type: 'string',
          },
        ],
        resources: {
          inputs: [
            {
              name: 'source',
              type: 'git',
            },
          ],
          outputs: [
            {
              name: 'image',
              type: 'image',
            },
          ],
        },
        steps: [],
      },
    },
  },
};
