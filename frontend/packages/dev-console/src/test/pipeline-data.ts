import { Pipeline, PipelineRun } from '../utils/pipeline-augment';

export enum DataState {
  IN_PROGRESS = 'In Progress',
  SUCCESS = 'Completed Successfully',
  CANCELLED = 'Cancelled',
  FAILED = 'Completed But Failed',
}

export enum PipelineExampleNames {
  COMPLEX_PIPELINE = 'complex-pipeline',
  PARTIAL_PIPELINE = 'partial-pipeline',
  SIMPLE_PIPELINE = 'simple-pipeline',
}

type CombinedPipelineTestData = {
  dataSource: string; // where the data was sourced from
  pipeline: Pipeline;
  pipelineRuns: { [key in DataState]?: PipelineRun };
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
                conditions: [{ status: 'Unknown', type: 'Succeeded' }],
              },
            },
            'simple-pipeline-br8cxv-hello-world-truncate-more-than-20--87v4h': {
              pipelineTaskName: 'hello-world-truncate-more-than-20-char',
              status: {
                conditions: [{ status: 'Unknown', type: 'Succeeded' }],
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
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'simple-pipeline-p1bun0-hello-world-truncate-more-than-20--cnd82': {
              pipelineTaskName: 'hello-world-truncate-more-than-20-char',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
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
      [DataState.FAILED]: {
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
      [DataState.CANCELLED]: {
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
              status: 'False',
              type: 'Succeeded',
            },
          ],
          taskRuns: {
            'complex-pipeline-fm4hax-build-app-gpq78': {
              pipelineTaskName: 'build-app',
              status: {
                conditions: [{ status: 'False', type: 'Succeeded' }],
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
              },
            },
            'complex-pipeline-6w9np2-test-suite-5-2l8ms': {
              pipelineTaskName: 'test-suite-5',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-deploy-image-vrmcf': {
              pipelineTaskName: 'deploy-image',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-build-app-6gkss': {
              pipelineTaskName: 'build-app',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-build-image-rkctm': {
              pipelineTaskName: 'build-image',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-verify-6djz9': {
              pipelineTaskName: 'verify',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-test-suite-2-88mk2': {
              pipelineTaskName: 'test-suite-2',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-test-suite-4-xqk5x': {
              pipelineTaskName: 'test-suite-4',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-test-suite-6-hvd6w': {
              pipelineTaskName: 'test-suite-6',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-test-suite-1-9bddh': {
              pipelineTaskName: 'test-suite-1',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-analyse-code-wrx7t': {
              pipelineTaskName: 'analyse-code',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-find-bugs-zqsdf': {
              pipelineTaskName: 'find-bugs',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
            'complex-pipeline-6w9np2-style-checks-d9s6v': {
              pipelineTaskName: 'style-checks',
              status: {
                conditions: [{ status: 'True', type: 'Succeeded' }],
              },
            },
          },
        },
      },
    },
  },
};
