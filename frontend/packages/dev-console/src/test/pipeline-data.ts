import { Pipeline, PipelineRun } from '../utils/pipeline-augment';
import { PipelineRunModel } from '../models';

export enum DataState {
  IN_PROGRESS = 'In Progress',
  SUCCESS = 'Completed Successfully',
  CANCELLED1 = 'Cancelled at stage1',
  CANCELLED2 = 'Cancelled at stage2 paralell task',
  CANCELLED3 = 'Cancelled at stage3 single task',
  FAILED = 'Completed But Failed',
}

export enum PipelineExampleNames {
  COMPLEX_PIPELINE = 'complex-pipeline',
  PARTIAL_PIPELINE = 'partial-pipeline',
  SIMPLE_PIPELINE = 'simple-pipeline',
  CLUSTER_PIPELINE = 'cluster-pipeline',
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
                conditions: [
                  {
                    reason: 'TaskRunCancelled',
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
              },
            },
            'simple-pipeline-7ergyh-build-2-x8jq2': {
              pipelineTaskName: 'build-2',
              status: {
                conditions: [
                  {
                    reason: 'TaskRunCancelled',
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
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
              },
            },
            'simple-pipeline-haeml4-deploy-qtpnz': {
              pipelineTaskName: 'deploy',
              status: {
                conditions: [
                  {
                    reason: 'TaskRunCancelled',
                    status: 'False',
                    type: 'Succeeded',
                  },
                ],
              },
            },
            'simple-pipeline-haeml4-push-4gj8n': {
              pipelineTaskName: 'push',
              status: {
                completionTime: '2019-12-10T11:18:58Z',
                conditions: [
                  {
                    reason: 'Succeeded',
                    status: 'True',
                    type: 'Succeeded',
                  },
                ],
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
};

export const mockPipelineRun = {
  apiVersion: `${PipelineRunModel.apiGroup}/${PipelineRunModel.apiVersion}`,
  kind: PipelineRunModel.kind,
  metadata: {
    creationTimestamp: '2020-03-26T19:40:48Z',
    generation: 1,
    labels: {
      'tekton.dev/pipeline': 'new-pipeline',
    },
    name: 'new-pipeline-p0hg8e',
    namespace: 'karthik',
    resourceVersion: '1167455',
    selfLink: '/apis/tekton.dev/v1alpha1/namespaces/karthik/pipelineruns/new-pipeline-p0hg8e',
    uid: '79e79e56-50d3-4159-a51c-db13dc5ac682',
  },
  spec: {
    pipelineRef: {
      name: 'new-pipeline',
    },
    resources: [
      {
        name: 'app-git',
        resourceRef: {
          name: 'git-hhckr7',
        },
      },
      {
        name: 'app-image',
        resourceRef: {
          name: 'image-2yx98v',
        },
      },
    ],
    serviceAccountName: 'pipeline',
    timeout: '1h0m0s',
  },
  status: {
    completionTime: '2020-03-26T19:42:50Z',
    conditions: [
      {
        lastTransitionTime: '2020-03-26T19:42:50Z',
        message: 'TaskRun new-pipeline-p0hg8e-s2i-5dwbk has failed',
        reason: 'Failed',
        status: 'False',
        type: 'Succeeded',
      },
    ],
    startTime: '2020-03-26T19:40:48Z',
    taskRuns: {
      'new-pipeline-p0hg8e-s2i-5dwbk': {
        pipelineTaskName: 's2i',
        status: {
          completionTime: '2020-03-26T19:42:50Z',
          conditions: [
            {
              lastTransitionTime: '2020-03-26T19:42:50Z',
              message:
                '"step-build" exited with code 1 (image: "quay.io/buildah/stable@sha256:52a993631e5f13f142c1de0ac19ed2188a1a4190bf4530ecaecb23bece0289c3"); for logs run: kubectl -n karthik logs new-pipeline-p0hg8e-s2i-5dwbk-pod-9ghcq -c step-build',
              reason: 'Failed',
              status: 'False',
              type: 'Succeeded',
            },
          ],
          podName: 'new-pipeline-p0hg8e-s2i-5dwbk-pod-9ghcq',
          startTime: '2020-03-26T19:40:48Z',
          steps: [
            {
              container: 'step-generate',
              imageID:
                'quay.io/openshift-pipeline/s2i@sha256:2432480b4bb6d2cef780cf2034073b9d49a582033f3455ba33c1f907a47b808f',
              name: 'generate',
              terminated: {
                containerID:
                  'cri-o://3eee948250e5d55f1a9c8e9ac7c7fe2bacb1b931b338fe8f9f41fa43f5e1a2d5',
                exitCode: 0,
                finishedAt: '2020-03-26T19:42:25Z',
                reason: 'Completed',
                startedAt: '2020-03-26T19:42:25Z',
              },
            },
            {
              container: 'step-build',
              imageID:
                'quay.io/buildah/stable@sha256:52a993631e5f13f142c1de0ac19ed2188a1a4190bf4530ecaecb23bece0289c3',
              name: 'build',
              terminated: {
                containerID:
                  'cri-o://9d3c83b21ff4330ca62df1a5a5ec9050e565ea47bc7cdf006108501a981b092c',
                exitCode: 1,
                finishedAt: '2020-03-26T19:42:48Z',
                reason: 'Error',
                startedAt: '2020-03-26T19:42:26Z',
              },
            },
            {
              container: 'step-create-dir-image-jpk5m',
              imageID:
                'registry.access.redhat.com/ubi8/ubi-minimal@sha256:01b8fb7b3ad16a575651a4e007e8f4d95b68f727b3a41fc57996be9a790dc4fa',
              name: 'create-dir-image-jpk5m',
              terminated: {
                containerID:
                  'cri-o://739ec43b1533ed11406ca1d53a7cbd9c9b854486a4282b772c12c4a2a946fe9c',
                exitCode: 0,
                finishedAt: '2020-03-26T19:42:20Z',
                reason: 'Completed',
                startedAt: '2020-03-26T19:42:20Z',
              },
            },
            {
              container: 'step-git-source-git-hhckr7-85cfc',
              imageID:
                'quay.io/openshift-pipeline/tektoncd-pipeline-git-init@sha256:0956ae04297fe4740af495ec1d6d51bd7fbd79686f5d5a4ea09ca44c4e9838cf',
              name: 'git-source-git-hhckr7-85cfc',
              terminated: {
                containerID:
                  'cri-o://0e9f11b927acc7c65387d0e0bd5e29e808d84fbeb367d06d23bd6fdc8289041d',
                exitCode: 0,
                finishedAt: '2020-03-26T19:42:25Z',
                message:
                  '[{"name":"","digest":"","key":"commit","value":"a096bd299d65517cef8079f4559e9b0b9f97ff57","resourceRef":{}}]',
                reason: 'Completed',
                startedAt: '2020-03-26T19:42:20Z',
              },
            },
          ],
        },
      },
    },
  },
};
