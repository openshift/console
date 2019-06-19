export const mockPipelineRun = {
  apiVersion: 'tekton.dev/v1alpha1',
  kind: 'PipelineRun',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"tekton.dev/v1alpha1","kind":"PipelineRun","metadata":{"annotations":{},"name":"tutorial-pipeline-run-1","namespace":"tekton-pipelines"},"spec":{"pipelineRef":{"name":"tutorial-pipeline"},"resources":[{"name":"source-repo","resourceRef":{"name":"skaffold-git"}},{"name":"web-image","resourceRef":{"name":"skaffold-image-leeroy-web"}}],"trigger":{"type":"manual"}}}\n',
    },
    selfLink:
      '/apis/tekton.dev/v1alpha1/namespaces/tekton-pipelines/pipelineruns/tutorial-pipeline-run-1',
    resourceVersion: '531347',
    name: 'tutorial-pipeline-run-1',
    uid: 'ebff21e8-8a1a-11e9-8eab-52fdfc072182',
    creationTimestamp: '2019-06-08T18:26:24Z',
    generation: 1,
    namespace: 'tekton-pipelines',
    labels: {
      'tekton.dev/pipeline': 'tutorial-pipeline',
    },
  },
  spec: {
    pipelineRef: {
      name: 'tutorial-pipeline',
    },
    resources: [
      {
        name: 'source-repo',
        resourceRef: {
          name: 'skaffold-git',
        },
      },
      {
        name: 'web-image',
        resourceRef: {
          name: 'skaffold-image-leeroy-web',
        },
      },
    ],
    serviceAccount: '',
    trigger: {
      type: 'manual',
    },
  },
  status: {
    completionTime: '2019-06-08T18:27:28Z',
    conditions: [
      {
        lastTransitionTime: '2019-06-08T18:27:28Z',
        message: 'All Tasks have completed executing',
        reason: 'Succeeded',
        status: 'True',
        type: 'Succeeded',
      },
    ],
    startTime: '2019-06-08T18:26:24Z',
    taskRuns: {
      'tutorial-pipeline-run-1-build-skaffold-web-s98hr': {
        pipelineTaskName: 'build-skaffold-web',
        status: {
          completionTime: '2019-06-08T18:26:56Z',
          conditions: [
            {
              lastTransitionTime: '2019-06-08T18:26:56Z',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          podName: 'tutorial-pipeline-run-1-build-skaffold-web-s98hr-pod-b0fc45',
          startTime: '2019-06-08T18:26:24Z',
          steps: [
            {
              name: 'build-and-push',
              terminated: {
                containerID:
                  'cri-o://dc7cdc11f878fe5d6c95ce7d3aa5a31b3586f3bbdb1fb001a0e13394f622aec2',
                exitCode: 0,
                finishedAt: '2019-06-08T18:26:55Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:26:55Z',
              },
            },
            {
              name: 'git-source-skaffold-git-prxcd',
              terminated: {
                containerID:
                  'cri-o://3ba8f0645ad3160778d335bd11940ec105e8a26408abe00bf1ca7d48616e0d59',
                exitCode: 0,
                finishedAt: '2019-06-08T18:26:54Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:26:35Z',
              },
            },
            {
              name: 'nop',
              terminated: {
                containerID:
                  'cri-o://64b61cac91394becb93b65e77c236d9d9c631905854a8dd16a1dbae4803faf8d',
                exitCode: 0,
                finishedAt: '2019-06-08T18:26:56Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:26:56Z',
              },
            },
          ],
        },
      },
      'tutorial-pipeline-run-1-deploy-web-9sgh6': {
        pipelineTaskName: 'deploy-web',
        status: {
          completionTime: '2019-06-08T18:27:28Z',
          conditions: [
            {
              lastTransitionTime: '2019-06-08T18:27:28Z',
              status: 'True',
              type: 'Succeeded',
            },
          ],
          podName: 'tutorial-pipeline-run-1-deploy-web-9sgh6-pod-a30845',
          startTime: '2019-06-08T18:26:56Z',
          steps: [
            {
              name: 'git-source-skaffold-git-k997z',
              terminated: {
                containerID:
                  'cri-o://354d7f3b3c543f98c6ac1fdb118777505a57d1c9d1a38520f4c82737c853053c',
                exitCode: 0,
                finishedAt: '2019-06-08T18:27:26Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:27:07Z',
              },
            },
            {
              name: 'post-deploy',
              terminated: {
                containerID:
                  'cri-o://e0a755bcda299370d9886825cde7d27682644e8796a2f0d019d2d8819c068e07',
                exitCode: 0,
                finishedAt: '2019-06-08T18:27:27Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:27:25Z',
              },
            },
            {
              name: 'replace-image',
              terminated: {
                containerID:
                  'cri-o://5596e313340dfeaf2b7fe53f7b13cfa2ddb293d731e5a185decf1defe838bada',
                exitCode: 0,
                finishedAt: '2019-06-08T18:27:26Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:27:15Z',
              },
            },
            {
              name: 'nop',
              terminated: {
                containerID:
                  'cri-o://ae947df276fb75dbc59edcaa68f561674b8163f08156dd255a71405523a9d8d4',
                exitCode: 0,
                finishedAt: '2019-06-08T18:27:28Z',
                reason: 'Completed',
                startedAt: '2019-06-08T18:27:26Z',
              },
            },
          ],
        },
      },
    },
  },
};
