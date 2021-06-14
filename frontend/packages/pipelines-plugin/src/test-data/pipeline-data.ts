import { K8sResourceKind } from '@console/internal/module/k8s';
import { TektonResourceLabel, preferredNameAnnotation } from '../components/pipelines/const';
import { TaskKindAlpha } from '../components/pipelines/resource-utils';
import { PipelineKind, PipelineRunKind, TaskRunKind, PipelineSpec, TaskKind } from '../types';

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
  SKIPPED = 'Skipped',
  PIPELINE_RUN_PENDING = 'PipelineRunPending',
  PIPELINE_RUN_CANCELLED = 'PipelineRunCancelled',
}

export enum PipelineExampleNames {
  COMPLEX_PIPELINE = 'complex-pipeline',
  PARTIAL_PIPELINE = 'partial-pipeline',
  SIMPLE_PIPELINE = 'simple-pipeline',
  CLUSTER_PIPELINE = 'cluster-pipeline',
  BROKEN_MOCK_APP = 'broken-mock-app',
  WORKSPACE_PIPELINE = 'workspace-pipeline',
  CONDITIONAL_PIPELINE = 'conditional-pipeline',
  INVALID_PIPELINE_MISSING_TASK = 'missing-task-pipeline',
  INVALID_PIPELINE_INVALID_TASK = 'invalid-task-pipeline',
  EMBEDDED_TASK_SPEC_MOCK_APP = 'embedded-task-spec',
  EMBEDDED_PIPELINE_SPEC = 'embedded-pipeline-spec',
  PIPELINE_WITH_FINALLY = 'pipeline-with-finally',
  RESULTS = 'results-pipeline',
}

type CombinedPipelineTestData = {
  dataSource: string; // where the data was sourced from
  pipeline: PipelineKind;
  pipelineRuns: { [key in DataState]?: PipelineRunKind };
  taskRuns?: TaskRunKind[];
  pods?: K8sResourceKind[];
  // esLint seems to be having issues detecting the usage above - but typescript is properly typing the value
  eslint_workaround?: PipelineRunKind;
};

type PipelineTestData = { [key in PipelineExampleNames]?: CombinedPipelineTestData };
type PipelineSpecData = { [key in PipelineExampleNames]?: PipelineSpec };

const pipelineSpec: PipelineSpecData = {
  [PipelineExampleNames.SIMPLE_PIPELINE]: {
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
  [PipelineExampleNames.PARTIAL_PIPELINE]: {
    tasks: [
      { name: 'hello-world-1', taskRef: { name: 'hello-world-1' } },
      {
        name: 'hello-world-truncate-more-than-20-char',
        taskRef: { name: 'hello-world-truncate-more-than-20-char' },
      },
      { name: 'hello-world-3', taskRef: { name: 'hello-world-3' } },
    ],
  },
  [PipelineExampleNames.COMPLEX_PIPELINE]: {
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
  [PipelineExampleNames.CLUSTER_PIPELINE]: {
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
  [PipelineExampleNames.BROKEN_MOCK_APP]: {
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
  [PipelineExampleNames.INVALID_PIPELINE_MISSING_TASK]: {
    tasks: [{ name: 'build-dist', taskRef: { kind: 'Task', name: 'not-a-task' } }],
  },
  [PipelineExampleNames.INVALID_PIPELINE_INVALID_TASK]: {
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
  [PipelineExampleNames.WORKSPACE_PIPELINE]: {
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
        optional: true,
      },
      {
        name: 'recipe-store',
        optional: false,
      },
      {
        name: 'shared-data',
      },
    ],
  },
  [PipelineExampleNames.CONDITIONAL_PIPELINE]: {
    tasks: [
      {
        name: 'first-create-file',
        resources: {
          outputs: [
            {
              name: 'workspace',
              resource: 'source-repo',
            },
          ],
        },
        taskRef: {
          kind: 'Task',
          name: 'create-readme-file',
        },
      },
      {
        when: [
          {
            input: '$(params.path)',
            operator: 'in',
            values: ['README.md'],
          },
        ],
        name: 'then-check',
        taskRef: {
          kind: 'Task',
          name: 'echo-hello',
        },
      },
    ],
  },
  [PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP]: {
    tasks: [
      {
        name: 'install-deps',
        taskSpec: {
          metadata: {},
          steps: [
            {
              args: ['Installing dependencies...\n\nDependencies installed successfully.'],
              command: ['echo'],
              image: 'ubuntu',
              name: 'install',
              resources: {},
            },
          ],
        },
      },
      {
        name: 'code-sanity',
        runAfter: ['install-deps'],
        taskSpec: {
          metadata: {},
          steps: [
            {
              args: ['Running Linter and Tests'],
              command: ['echo'],
              image: 'ubuntu',
              name: 'startup',
              resources: {},
            },
            {
              args: ['0 Lint Errors'],
              command: ['echo'],
              image: 'ubuntu',
              name: 'lint-errors',
              resources: {},
            },
            {
              args: ['0 Test Failures'],
              command: ['echo'],
              image: 'ubuntu',
              name: 'test-status',
              resources: {},
            },
            {
              args: [
                'Exporting Test Coverage Report...\n\nCoverage report can be found in __coverage__',
              ],
              command: ['echo'],
              image: 'ubuntu',
              name: 'coverage-report',
              resources: {},
            },
          ],
        },
      },
      {
        name: 'compile',
        runAfter: ['install-deps'],
        taskSpec: {
          metadata: {},
          steps: [
            {
              args: ['Compiling code and producing dist folder...\n\nFolder public/dist created'],
              command: ['echo'],
              image: 'ubuntu',
              name: 'build',
              resources: {},
            },
          ],
        },
      },
      {
        name: 'e2e-tests',
        runAfter: ['code-sanity', 'compile'],
        taskSpec: {
          metadata: {},
          steps: [
            {
              args: ['Running end-to-end tests...\n\nAll tests pass'],
              command: ['echo'],
              image: 'ubuntu',
              name: 'status',
              resources: {},
            },
          ],
        },
      },
    ],
  },
  [PipelineExampleNames.PIPELINE_WITH_FINALLY]: {
    tasks: [
      {
        name: 'hello-world-1',
        taskRef: { name: 'hello-world-1' },
      },
      {
        name: 'hello-world-2',
        taskRef: { name: 'hello-world-2' },
      },
    ],
    finally: [
      {
        name: 'run-anyway',
        taskRef: { name: 'run-anyway' },
      },
    ],
  },
  [PipelineExampleNames.RESULTS]: {
    params: [
      {
        description: 'the first operand',
        name: 'first',
        type: 'string',
      },
      {
        description: 'the second operand',
        name: 'second',
        type: 'string',
      },
      {
        description: 'the third operand',
        name: 'third',
        type: 'string',
      },
    ],
    results: [
      {
        description: 'the sum of all three operands',
        name: 'sum',
        value: '$(tasks.second-add.results.sum)',
      },
      {
        description: 'the sum of first two operands',
        name: 'partial-sum',
        value: '$(tasks.first-add.results.sum)',
      },
      {
        description: 'the sum of everything',
        name: 'all-sum',
        value: '$(tasks.second-add.results.sum)-$(tasks.first-add.results.sum)',
      },
    ],
    tasks: [
      {
        name: 'first-add',
        params: [
          {
            name: 'first',
            value: '$(params.first)',
          },
          {
            name: 'second',
            value: '$(params.second)',
          },
        ],
        taskRef: {
          kind: 'Task',
          name: 'add-task',
        },
      },
      {
        name: 'second-add',
        params: [
          {
            name: 'first',
            value: '$(tasks.first-add.results.sum)',
          },
          {
            name: 'second',
            value: '$(params.third)',
          },
        ],
        taskRef: {
          kind: 'Task',
          name: 'add-task',
        },
      },
    ],
  },
};
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
      spec: pipelineSpec[PipelineExampleNames.SIMPLE_PIPELINE],
    },
    pipelineRuns: {
      [DataState.IN_PROGRESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'simple-pipeline-br8cxv',
          namespace: 'tekton-pipelines',
          creationTimestamp: '2020-10-29T06:11:46Z',
          labels: { [TektonResourceLabel.pipeline]: 'simple-pipeline' },
        },
        spec: {
          pipelineRef: { name: 'simple-pipeline' },
          resources: [
            { name: 'source-repo', resourceRef: { name: 'mapit-git' } },
            { name: 'web-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
        status: {
          completionTime: '2019-12-10T11:18:38Z',
          pipelineSpec: pipelineSpec[PipelineExampleNames.SIMPLE_PIPELINE],
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
          creationTimestamp: '2020-10-29T09:58:19Z',
          labels: { [TektonResourceLabel.pipeline]: 'simple-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.SIMPLE_PIPELINE],
          completionTime: '2019-10-29T11:57:53Z',
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
      [DataState.PIPELINE_RUN_PENDING]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'simple-pipeline-p1bun0',
          namespace: 'tekton-pipelines',
          creationTimestamp: '2020-10-29T09:58:19Z',
          labels: { [TektonResourceLabel.pipeline]: 'simple-pipeline' },
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
          status: 'PipelineRunPending',
        },
        status: {
          pipelineSpec: pipelineSpec[PipelineExampleNames.SIMPLE_PIPELINE],
          completionTime: '2019-10-29T11:57:53Z',
          conditions: [
            {
              lastTransitionTime: '2019-09-12T20:38:01Z',
              message: 'All Tasks have completed executing',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
        },
      },

      [DataState.PIPELINE_RUN_CANCELLED]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'simple-pipeline-p1bun0',
          namespace: 'tekton-pipelines',
          creationTimestamp: '2020-10-29T09:58:19Z',
          labels: { [TektonResourceLabel.pipeline]: 'simple-pipeline' },
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
          status: 'PipelineRunCancelled',
        },
        status: {
          pipelineSpec: pipelineSpec[PipelineExampleNames.SIMPLE_PIPELINE],
          completionTime: '2019-10-29T11:57:53Z',
          conditions: [
            {
              lastTransitionTime: '2019-09-12T20:38:01Z',
              message: 'All Tasks have completed executing',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
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
      spec: pipelineSpec[PipelineExampleNames.PARTIAL_PIPELINE],
    },
    pipelineRuns: {
      [DataState.FAILED_BUT_COMPLETE]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'partial-pipeline-3tt7aw',
          namespace: 'tekton-pipelines',
          labels: { [TektonResourceLabel.pipeline]: 'partial-pipeline' },
        },
        spec: {
          pipelineRef: { name: 'partial-pipeline' },
        },
        status: {
          pipelineSpec: pipelineSpec[PipelineExampleNames.PARTIAL_PIPELINE],
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
      spec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
    },
    pipelineRuns: {
      [DataState.CANCELLED1]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'complex-pipeline-fm4hax',
          namespace: 'tekton-pipelines',
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
          labels: { [TektonResourceLabel.pipeline]: 'complex-pipeline' },
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.COMPLEX_PIPELINE],
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
        uid: 'd22b9451-cd71-47f3-be1a-4ca93647b76e',
      },
      spec: pipelineSpec[PipelineExampleNames.CLUSTER_PIPELINE],
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
          uid: 'd067dfb0-dc9d-49b2-a998-c93636c50b7d',
        },
        spec: {
          pipelineRef: { name: 'react-web-app-cluster-mock-app-pipeline' },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2019-11-22T15:21:55Z',
          pipelineSpec: pipelineSpec[PipelineExampleNames.CLUSTER_PIPELINE],
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
      spec: pipelineSpec[PipelineExampleNames.BROKEN_MOCK_APP],
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.BROKEN_MOCK_APP],
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
      [DataState.FAILED2]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'broken-app-pipeline-failed',
          labels: {
            'pipeline.openshift.io/started-by': 'kubeadmin',
            'tekton.dev/pipeline': 'broken-app-pipeline',
          },
          uid: '27a7fcad-8711-48df-8135-8e856f997e60',
        },
        spec: {
          pipelineRef: {
            name: 'fetch-and-print-recipe',
          },
          serviceAccountName: 'pipeline',
          timeout: '5s',
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
          completionTime: '2021-05-12T11:37:31Z',
          conditions: [
            {
              lastTransitionTime: '2021-05-12T11:37:31Z',
              message: 'PipelineRun "fetch-and-print-recipe-test" failed to finish within "5s"',
              reason: 'PipelineRunTimeout',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          pipelineSpec: pipelineSpec[PipelineExampleNames.BROKEN_MOCK_APP],
          startTime: '2021-05-12T11:37:26Z',
          taskRuns: {
            'fetch-and-print-recipe-test-fetch-the-recipe-5pb9p': {
              pipelineTaskName: 'fetch-the-recipe',
              status: {
                completionTime: '2021-05-12T11:37:32Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-05-12T11:37:32Z',
                    message:
                      'TaskRun "fetch-and-print-recipe-test-fetch-the-recipe-5pb9p" failed to finish within "5s"',
                    reason: 'TaskRunTimeout',
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
                podName: 'fetch-and-print-recipe-test-fetch-the-recipe-5pb9p-pod-ksbnx',
                startTime: '2021-05-12T11:37:27Z',
                steps: [
                  {
                    container: 'step-fetch-and-write',
                    name: 'fetch-and-write',
                  },
                ],
                taskSpec: {
                  steps: [
                    {
                      image: 'ubuntu',
                      name: 'fetch-and-write',
                      resources: {},
                    },
                  ],
                  workspaces: [
                    {
                      name: 'super-secret-password',
                    },
                    {
                      name: 'secure-store',
                    },
                    {
                      name: 'filedrop',
                    },
                  ],
                },
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
          annotations: {
            'pipeline.tekton.dev/release': 'v0.22.0',
          },
          name: 'recipe-time-hwtzt-fetch-the-recipe-x2b4n',
          ownerReferences: [
            {
              apiVersion: 'tekton.dev/v1beta1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'PipelineRun',
              name: 'recipe-time-hwtzt',
              uid: '6308f220-4da5-4d1a-9240-9a032fa1e56a',
            },
          ],
          labels: {
            'app.kubernetes.io/managed-by': 'tekton-pipelines',
            'tekton.dev/pipeline': 'fetch-and-print-recipe',
            'tekton.dev/pipelineRun': 'recipe-time-hwtzt',
            'tekton.dev/pipelineTask': 'fetch-the-recipe',
            'tekton.dev/task': 'fetch-secure-data',
          },
        },
        spec: {
          serviceAccountName: 'pipeline',
          taskRef: {
            kind: 'Task',
            name: 'fetch-secure-data',
          },
          timeout: '5s',
          workspaces: [
            {
              name: 'super-secret-password',
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
              name: 'secure-store',
            },
            {
              name: 'filedrop',
              persistentVolumeClaim: {
                claimName: 'shared-task-storage',
              },
            },
          ],
        },
        status: {
          completionTime: '2021-05-12T13:23:59Z',
          conditions: [
            {
              lastTransitionTime: '2021-05-12T13:23:59Z',
              message:
                'TaskRun "recipe-time-hwtzt-fetch-the-recipe-x2b4n" failed to finish within "5s"',
              reason: 'TaskRunTimeout',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          podName: 'recipe-time-hwtzt-fetch-the-recipe-x2b4n-pod-v4wzv',
          startTime: '2021-05-12T13:23:53Z',
        },
      },
    ],
  },
  [PipelineExampleNames.INVALID_PIPELINE_MISSING_TASK]: {
    dataSource: 'missing-task-reference',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'task-ref-error',
      },
      spec: pipelineSpec[PipelineExampleNames.INVALID_PIPELINE_MISSING_TASK],
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.INVALID_PIPELINE_MISSING_TASK],
          completionTime: '2020-07-13T17:21:05Z',
          conditions: [
            {
              lastTransitionTime: '2020-07-13T17:21:05Z',
              message: 'Test error text',
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
      spec: pipelineSpec[PipelineExampleNames.INVALID_PIPELINE_INVALID_TASK],
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
          pipelineSpec: pipelineSpec[PipelineExampleNames.INVALID_PIPELINE_INVALID_TASK],
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
      spec: pipelineSpec[PipelineExampleNames.WORKSPACE_PIPELINE],
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
          startTime: '2020-10-07T07:36:01Z',
          pipelineSpec: pipelineSpec[PipelineExampleNames.WORKSPACE_PIPELINE],
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
  [PipelineExampleNames.CONDITIONAL_PIPELINE]: {
    dataSource: 'conditional-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        name: 'conditional-pipeline',
        namespace: 'tekton-pipelines',
      },
      spec: pipelineSpec[PipelineExampleNames.CONDITIONAL_PIPELINE],
    },
    pipelineRuns: {
      [DataState.SKIPPED]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'when-expression-pipeline-cx05c9',
          namespace: 'tekton-pipelines',
          labels: {
            'tekton.dev/pipeline': 'when-expression-pipeline',
          },
        },
        spec: {
          params: [
            {
              name: 'path',
              value: 'README.txt',
            },
          ],
          pipelineRef: {
            name: 'when-expression-pipeline',
          },
          resources: [
            {
              name: 'source-repo',
              resourceRef: {
                name: 'pipeline-git',
              },
            },
          ],
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2021-01-13T14:34:19Z',
          conditions: [
            {
              lastTransitionTime: '2021-01-13T14:34:19Z',
              message: 'Tasks Completed: 1 (Failed: 0, Cancelled 0), Skipped: 1',
              reason: 'Completed',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          pipelineSpec: {
            params: [
              {
                default: 'README.md',
                name: 'path',
                type: 'string',
              },
            ],
            resources: [
              {
                name: 'source-repo',
                type: 'git',
              },
            ],
            tasks: [
              {
                name: 'first-create-file',
                resources: {
                  outputs: [
                    {
                      name: 'workspace',
                      resource: 'source-repo',
                    },
                  ],
                },
                taskRef: {
                  kind: 'Task',
                  name: 'create-readme-file',
                },
              },
              {
                name: 'then-check',
                taskRef: {
                  kind: 'Task',
                  name: 'echo-hello',
                },
                when: [
                  {
                    input: '$(params.path)',
                    operator: 'in',
                    values: ['README.md'],
                  },
                ],
              },
            ],
          },
          skippedTasks: [
            {
              name: 'then-check',
            },
          ],
          startTime: '2021-01-13T14:33:59Z',
          taskRuns: {
            'when-expression-pipeline-cx05c9-first-create-file-4sqr2': {
              pipelineTaskName: 'first-create-file',
              status: {
                completionTime: '2021-01-13T14:34:19Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-01-13T14:34:19Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'when-expression-pipeline-cx05c9-first-create-file-4sqr2-p-2p5j8',
                startTime: '2021-01-13T14:33:59Z',
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP]: {
    dataSource: 'mock-app-embedded-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'mock-app-embedded-pipeline',
        uid: '702ba12f-e159-44b4-827f-7e3d0696ca6e',
      },
      spec: pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP],
    },
    pipelineRuns: {
      [DataState.IN_PROGRESS]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          annotations: {
            'pipeline.openshift.io/preferredName': 'mock-app-embedded-pipeline',
            'pipeline.openshift.io/started-by': 'kube:admin',
          },
          name: 'mock-app-embedded-pipeline-zuazs0',
          uid: '7d03e1f1-69d7-4c2d-90b6-e17316482e68',
          labels: {
            'tekton.dev/pipeline': 'mock-app-embedded-pipeline',
          },
        },
        spec: {
          pipelineRef: {
            name: 'mock-app-embedded-pipeline',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2021-04-23T14:43:50Z',
              message: 'Tasks Completed: 1 (Failed: 0, Cancelled 0), Incomplete: 3, Skipped: 0',
              reason: 'Running',
              status: 'Unknown',
              type: 'Succeeded',
            },
          ],
          pipelineSpec: pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP],
          startTime: '2021-04-23T14:43:30Z',
          taskRuns: {
            'mock-app-embedded-pipeline-zuazs0-code-sanity-6hpzr': {
              pipelineTaskName: 'code-sanity',
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:43:56Z',
                    message:
                      'pod status "Ready":"False"; message: "containers with unready status: [step-startup step-lint-errors step-test-status step-coverage-report]"',
                    reason: 'Pending',
                    status: 'Unknown',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-code-sanity-6hpzr-pod-tgrm2',
                startTime: '2021-04-23T14:43:50Z',
                steps: [
                  {
                    container: 'step-startup',
                    name: 'startup',
                    waiting: {
                      reason: 'PodInitializing',
                    },
                  },
                  {
                    container: 'step-lint-errors',
                    name: 'lint-errors',
                    waiting: {
                      reason: 'PodInitializing',
                    },
                  },
                  {
                    container: 'step-test-status',
                    name: 'test-status',
                    waiting: {
                      reason: 'PodInitializing',
                    },
                  },
                  {
                    container: 'step-coverage-report',
                    name: 'coverage-report',
                    waiting: {
                      reason: 'PodInitializing',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[1].taskSpec,
              },
            },
            'mock-app-embedded-pipeline-zuazs0-compile-gtx5z': {
              pipelineTaskName: 'compile',
              status: {
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:43:57Z',
                    message: 'Not all Steps in the Task have finished executing',
                    reason: 'Running',
                    status: 'Unknown',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-compile-gtx5z-pod-hhbgw',
                startTime: '2021-04-23T14:43:50Z',
                steps: [
                  {
                    container: 'step-build',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'build',
                    running: {
                      startedAt: '2021-04-23T14:43:56Z',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[2].taskSpec,
              },
            },
            'mock-app-embedded-pipeline-zuazs0-install-deps-75vvh': {
              pipelineTaskName: 'install-deps',
              status: {
                completionTime: '2021-04-23T14:43:49Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:43:49Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-install-deps-75vvh-pod-pdldm',
                startTime: '2021-04-23T14:43:30Z',
                steps: [
                  {
                    container: 'step-install',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'install',
                    terminated: {
                      containerID:
                        'cri-o://4e21f21a73bf9d3d650464821e30adcaa282b6a4b6cbaca642deebdd1da3aeb2',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:43:49Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:43:49Z',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[0].taskSpec,
              },
            },
          },
        },
      },
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          annotations: {
            'pipeline.openshift.io/preferredName': 'mock-app-embedded-pipeline',
            'pipeline.openshift.io/started-by': 'kube:admin',
          },
          name: 'mock-app-embedded-pipeline-zuazs0',
          uid: '7d03e1f1-69d7-4c2d-90b6-e17316482e68',
          labels: {
            'tekton.dev/pipeline': 'mock-app-embedded-pipeline',
          },
        },
        spec: {
          pipelineRef: {
            name: 'mock-app-embedded-pipeline',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2021-04-23T14:44:11Z',
          conditions: [
            {
              lastTransitionTime: '2021-04-23T14:44:11Z',
              message: 'Tasks Completed: 4 (Failed: 0, Cancelled 0), Skipped: 0',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          pipelineSpec: pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP],
          startTime: '2021-04-23T14:43:30Z',
          taskRuns: {
            'mock-app-embedded-pipeline-zuazs0-code-sanity-6hpzr': {
              pipelineTaskName: 'code-sanity',
              status: {
                completionTime: '2021-04-23T14:44:03Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:44:03Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-code-sanity-6hpzr-pod-tgrm2',
                startTime: '2021-04-23T14:43:50Z',
                steps: [
                  {
                    container: 'step-startup',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'startup',
                    terminated: {
                      containerID:
                        'cri-o://3cf477b2c7bd79d5a0b09c7b06b7f73e29037034a63cd6d0b14dde552194dc57',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:44:00Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:44:00Z',
                    },
                  },
                  {
                    container: 'step-lint-errors',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'lint-errors',
                    terminated: {
                      containerID:
                        'cri-o://52029e07d5f1da01d5d43d7b9b8bf2de9344e871d024a9eb811ee8283d015b6b',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:44:01Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:44:01Z',
                    },
                  },
                  {
                    container: 'step-test-status',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'test-status',
                    terminated: {
                      containerID:
                        'cri-o://a8e63c405c9c2ccd017daf610a1424285202ceed001ebe93aeaf038298ca998f',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:44:01Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:44:01Z',
                    },
                  },
                  {
                    container: 'step-coverage-report',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'coverage-report',
                    terminated: {
                      containerID:
                        'cri-o://66696f96ad23e0fd383f076e0845963953f2559d79133fe8533efefc3eeadb7c',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:44:02Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:44:02Z',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[1].taskSpec,
              },
            },
            'mock-app-embedded-pipeline-zuazs0-compile-gtx5z': {
              pipelineTaskName: 'compile',
              status: {
                completionTime: '2021-04-23T14:43:59Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:43:59Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-compile-gtx5z-pod-hhbgw',
                startTime: '2021-04-23T14:43:50Z',
                steps: [
                  {
                    container: 'step-build',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'build',
                    terminated: {
                      containerID:
                        'cri-o://86be196caf01689b4900d17fc71bc34751ce45e01433931ef8c3a0222f1ae474',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:43:58Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:43:58Z',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[2].taskSpec,
              },
            },
            'mock-app-embedded-pipeline-zuazs0-e2e-tests-7zrkm': {
              pipelineTaskName: 'e2e-tests',
              status: {
                completionTime: '2021-04-23T14:44:11Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:44:11Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-e2e-tests-7zrkm-pod-qcr97',
                startTime: '2021-04-23T14:44:04Z',
                steps: [
                  {
                    container: 'step-status',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'status',
                    terminated: {
                      containerID:
                        'cri-o://8a5989caa2ddcc7a2b838150c028bc27e1a2d7bc6a458cad651ae67c3cef31b4',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:44:10Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:44:10Z',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[3].taskSpec,
              },
            },
            'mock-app-embedded-pipeline-zuazs0-install-deps-75vvh': {
              pipelineTaskName: 'install-deps',
              status: {
                completionTime: '2021-04-23T14:43:49Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T14:43:49Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'mock-app-embedded-pipeline-zuazs0-install-deps-75vvh-pod-pdldm',
                startTime: '2021-04-23T14:43:30Z',
                steps: [
                  {
                    container: 'step-install',
                    imageID:
                      'docker.io/library/ubuntu@sha256:3c9c713e0979e9bd6061ed52ac1e9e1f246c9495aa063619d9d695fb8039aa1f',
                    name: 'install',
                    terminated: {
                      containerID:
                        'cri-o://4e21f21a73bf9d3d650464821e30adcaa282b6a4b6cbaca642deebdd1da3aeb2',
                      exitCode: 0,
                      finishedAt: '2021-04-23T14:43:49Z',
                      reason: 'Completed',
                      startedAt: '2021-04-23T14:43:49Z',
                    },
                  },
                ],
                taskSpec:
                  pipelineSpec[PipelineExampleNames.EMBEDDED_TASK_SPEC_MOCK_APP].tasks[0].taskSpec,
              },
            },
          },
        },
      },
    },
  },
  [PipelineExampleNames.EMBEDDED_PIPELINE_SPEC]: {
    dataSource: 'embedded-pipelineSpec',
    pipeline: null,
    pipelineRuns: {
      [DataState.IN_PROGRESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'pipelinerun-with-embedded-pipelineSpec',
          namespace: 'tekton-pipelines',
          creationTimestamp: '2020-10-29T06:11:46Z',
        },
        spec: {
          pipelineSpec: {
            tasks: [
              {
                name: 'echo-good-morning',
                taskSpec: {
                  steps: [
                    {
                      name: 'echo',
                      image: 'ubuntu',
                      script: ['#!/usr/bin/env bash echo "Good Morning!"'],
                    },
                  ],
                },
              },
            ],
          },
          resources: [
            { name: 'source-repo', resourceRef: { name: 'mapit-git' } },
            { name: 'web-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
      },
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'pipelinerun-wit-embedded-pipelineSpec-p1bun0',
          namespace: 'tekton-pipelines',
          creationTimestamp: '2020-10-29T09:58:19Z',
          annotations: {
            [preferredNameAnnotation]: 'pipelinerun-wit-embedded-pipelineSpec',
          },
        },
        spec: {
          pipelineSpec: {
            tasks: [
              {
                name: 'echo-good-morning',
                taskSpec: {
                  steps: [
                    {
                      name: 'echo',
                      image: 'ubuntu',
                      script: ['#!/usr/bin/env bash echo "Good Morning!"'],
                    },
                  ],
                },
              },
            ],
          },
          resources: [
            { name: 'source-repo', resourceRef: { name: 'mapit-git' } },
            {
              name: 'web-image',
              resourceRef: { name: 'mapit-image' },
            },
          ],
        },
      },
      [DataState.SKIPPED]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'embedded-pipelineSpec-br8cxv',
          namespace: 'tekton-pipelines',
          creationTimestamp: '2020-10-29T06:11:46Z',
          labels: { [TektonResourceLabel.pipeline]: 'embedded-pipelineSpec' },
        },
        spec: {
          pipelineRef: { name: 'embedded-pipelineSpec' },
          resources: [
            { name: 'source-repo', resourceRef: { name: 'mapit-git' } },
            { name: 'web-image', resourceRef: { name: 'mapit-image' } },
          ],
        },
      },
    },
  },
  [PipelineExampleNames.PIPELINE_WITH_FINALLY]: {
    dataSource: 'finally-pipeline',
    pipeline: {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        name: 'finally-pipeline',
        namespace: 'tekton-pipelines',
      },
      spec: pipelineSpec[PipelineExampleNames.PIPELINE_WITH_FINALLY],
    },
    pipelineRuns: {
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          name: 'finally-pipeline-3tt7aw',
          namespace: 'tekton-pipelines',
          labels: { [TektonResourceLabel.pipeline]: 'finally-pipeline' },
        },
        spec: {
          pipelineRef: { name: 'finally-pipeline' },
        },
        status: {
          pipelineSpec: pipelineSpec[PipelineExampleNames.PIPELINE_WITH_FINALLY],
          completionTime: '2019-10-29T11:57:53Z',
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
            'pipeline-p1bun0-hello-world-1-rlj9b': {
              pipelineTaskName: 'hello-world-1',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'pipeline-p1bun0-hello-world-2-wccp2': {
              pipelineTaskName: 'hello-world-2',
              status: {
                completionTime: '2019-12-10T11:18:38Z',
                conditions: [{ status: 'True', type: 'Succeeded' }],
                podName: 'test',
                startTime: '2019-12-10T11:18:38Z',
              },
            },
            'pipeline-p1bun0-run-anyway-cnd82': {
              pipelineTaskName: 'run-anyway',
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
  [PipelineExampleNames.RESULTS]: {
    dataSource: 'upstream-results-example',
    pipeline: {
      apiVersion: 'tekton.dev/v1beta1',
      kind: 'Pipeline',
      metadata: {
        name: 'sum-three-pipeline',
        uid: 'de0ace30-54f1-4e77-b99f-1894263f1d20',
      },
      spec: pipelineSpec[PipelineExampleNames.RESULTS],
    },
    pipelineRuns: {
      [DataState.SUCCESS]: {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'PipelineRun',
        metadata: {
          name: 'sum-three-pipeline-run',
          uid: 'fc2f17c0-f53d-4373-99e9-14f4636696a0',
          labels: {
            'tekton.dev/pipeline': 'sum-three-pipeline',
          },
        },
        spec: {
          params: [
            {
              name: 'first',
              value: '2',
            },
            {
              name: 'second',
              value: '10',
            },
            {
              name: 'third',
              value: '10',
            },
          ],
          pipelineRef: {
            name: 'sum-three-pipeline',
          },
          serviceAccountName: 'pipeline',
          timeout: '1h0m0s',
        },
        status: {
          completionTime: '2021-04-23T15:22:32Z',
          conditions: [
            {
              lastTransitionTime: '2021-04-23T15:22:32Z',
              message: 'Tasks Completed: 2 (Failed: 0, Cancelled 0), Skipped: 0',
              reason: 'Succeeded',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          pipelineResults: [
            {
              name: 'sum',
              value: '22',
            },
            {
              name: 'partial-sum',
              value: '12',
            },
            {
              name: 'all-sum',
              value: '22-12',
            },
          ],
          pipelineSpec: pipelineSpec[PipelineExampleNames.RESULTS],
          startTime: '2021-04-23T15:22:19Z',
          taskRuns: {
            'sum-three-pipeline-run-first-add-tpmxp': {
              pipelineTaskName: 'first-add',
              status: {
                completionTime: '2021-04-23T15:22:27Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T15:22:27Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'sum-three-pipeline-run-first-add-tpmxp-pod-22wv9',
                startTime: '2021-04-23T15:22:19Z',
                steps: [
                  {
                    container: 'step-add',
                    imageID:
                      'docker.io/library/alpine@sha256:69e70a79f2d41ab5d637de98c1e0b055206ba40a8145e7bddb55ccc04e13cf8f',
                    name: 'add',
                    terminated: {
                      containerID:
                        'cri-o://52386d3a95311cd3104289b077bb89952b7263d52dd2cc0b34460b4c7b5428cd',
                      exitCode: 0,
                      finishedAt: '2021-04-23T15:22:27Z',
                      message: '[{"key":"sum","value":"12","type":"TaskRunResult"}]',
                      reason: 'Completed',
                      startedAt: '2021-04-23T15:22:27Z',
                    },
                  },
                ],
                taskResults: [
                  {
                    name: 'sum',
                    value: '12',
                  },
                ],
                taskSpec: {
                  params: [
                    {
                      description: 'the first operand',
                      name: 'first',
                      type: 'string',
                    },
                    {
                      description: 'the second operand',
                      name: 'second',
                      type: 'string',
                    },
                  ],
                  results: [
                    {
                      description: 'the sum of the first and second operand',
                      name: 'sum',
                    },
                  ],
                  steps: [
                    {
                      // eslint-disable-next-line no-template-curly-in-string
                      args: ['echo -n $((${OP1}+${OP2})) | tee $(results.sum.path);'],
                      command: ['/bin/sh', '-c'],
                      env: [
                        {
                          name: 'OP1',
                          value: '$(params.first)',
                        },
                        {
                          name: 'OP2',
                          value: '$(params.second)',
                        },
                      ],
                      image: 'alpine',
                      name: 'add',
                      resources: {},
                    },
                  ],
                },
              },
            },
            'sum-three-pipeline-run-second-add-tt8n6': {
              pipelineTaskName: 'second-add',
              status: {
                completionTime: '2021-04-23T15:22:32Z',
                conditions: [
                  {
                    lastTransitionTime: '2021-04-23T15:22:32Z',
                    message: 'All Steps have completed executing',
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
                podName: 'sum-three-pipeline-run-second-add-tt8n6-pod-jlfxr',
                startTime: '2021-04-23T15:22:27Z',
                steps: [
                  {
                    container: 'step-add',
                    imageID:
                      'docker.io/library/alpine@sha256:69e70a79f2d41ab5d637de98c1e0b055206ba40a8145e7bddb55ccc04e13cf8f',
                    name: 'add',
                    terminated: {
                      containerID:
                        'cri-o://9861764a11f0a12af4c1fa61b5c185947abb79b20c6d99fe3334d35b84f88eb2',
                      exitCode: 0,
                      finishedAt: '2021-04-23T15:22:32Z',
                      message: '[{"key":"sum","value":"22","type":"TaskRunResult"}]',
                      reason: 'Completed',
                      startedAt: '2021-04-23T15:22:32Z',
                    },
                  },
                ],
                taskResults: [
                  {
                    name: 'sum',
                    value: '22',
                  },
                ],
                taskSpec: {
                  params: [
                    {
                      description: 'the first operand',
                      name: 'first',
                      type: 'string',
                    },
                    {
                      description: 'the second operand',
                      name: 'second',
                      type: 'string',
                    },
                  ],
                  results: [
                    {
                      description: 'the sum of the first and second operand',
                      name: 'sum',
                    },
                  ],
                  steps: [
                    {
                      // eslint-disable-next-line no-template-curly-in-string
                      args: ['echo -n $((${OP1}+${OP2})) | tee $(results.sum.path);'],
                      command: ['/bin/sh', '-c'],
                      env: [
                        {
                          name: 'OP1',
                          value: '$(params.first)',
                        },
                        {
                          name: 'OP2',
                          value: '$(params.second)',
                        },
                      ],
                      image: 'alpine',
                      name: 'add',
                      resources: {},
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};

type TaskTestData = {
  v1alpha1: { buildah: TaskKindAlpha };
  v1beta1: { buildah: TaskKind };
};
export const taskTestData: TaskTestData = {
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
