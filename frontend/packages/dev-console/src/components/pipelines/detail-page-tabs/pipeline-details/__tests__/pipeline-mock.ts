export const mockPipeline = {
  apiVersion: 'tekton.dev/v1alpha1',
  kind: 'Pipeline',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"tekton.dev/v1alpha1","kind":"Pipeline","metadata":{"annotations":{},"name":"tutorial-pipeline","namespace":"tekton-pipelines"},"spec":{"resources":[{"name":"source-repo","type":"git"},{"name":"web-image","type":"image"}],"tasks":[{"name":"build-skaffold-web","params":[{"name":"pathToDockerFile","value":"Dockerfile"},{"name":"pathToContext","value":"/workspace/docker-source/examples/microservices/leeroy-web"}],"resources":{"inputs":[{"name":"docker-source","resource":"source-repo"}],"outputs":[{"name":"builtImage","resource":"web-image"}]},"taskRef":{"name":"build-docker-image-from-git-source"}},{"name":"deploy-web","params":[{"name":"path","value":"/workspace/source/examples/microservices/leeroy-web/kubernetes/deployment.yaml"},{"name":"yqArg","value":"-d1"},{"name":"yamlPathToImage","value":"spec.template.spec.containers[0].image"}],"resources":{"inputs":[{"name":"source","resource":"source-repo"},{"from":["build-skaffold-web"],"name":"image","resource":"web-image"}]},"taskRef":{"name":"deploy-using-kubectl"}}]}}\n',
    },
    creationTimestamp: '2019-06-08T17:22:54Z',
    generation: 1,
    name: 'tutorial-pipeline',
    namespace: 'tekton-pipelines',
    resourceVersion: '517078',
    selfLink: '/apis/tekton.dev/v1alpha1/namespaces/tekton-pipelines/pipelines/tutorial-pipeline',
    uid: '0d4a9e56-8a12-11e9-8eab-52fdfc072182',
  },
  spec: {
    resources: [
      {
        name: 'source-repo',
        type: 'git',
      },
      {
        name: 'web-image',
        type: 'image',
      },
    ],
    tasks: [
      {
        name: 'build-skaffold-web',
        params: [
          {
            name: 'pathToDockerFile',
            value: 'Dockerfile',
          },
          {
            name: 'pathToContext',
            value: '/workspace/docker-source/examples/microservices/leeroy-web',
          },
        ],
        resources: {
          inputs: [
            {
              name: 'docker-source',
              resource: 'source-repo',
            },
          ],
          outputs: [
            {
              name: 'builtImage',
              resource: 'web-image',
            },
          ],
        },
        taskRef: {
          name: 'build-docker-image-from-git-source',
        },
      },
      {
        name: 'deploy-web',
        params: [
          {
            name: 'path',
            value: '/workspace/source/examples/microservices/leeroy-web/kubernetes/deployment.yaml',
          },
          {
            name: 'yqArg',
            value: '-d1',
          },
          {
            name: 'yamlPathToImage',
            value: 'spec.template.spec.containers[0].image',
          },
        ],
        resources: {
          inputs: [
            {
              name: 'source',
              resource: 'source-repo',
            },
            {
              from: ['build-skaffold-web'],
              name: 'image',
              resource: 'web-image',
            },
          ],
        },
        taskRef: {
          name: 'deploy-using-kubectl',
        },
      },
    ],
  },
};
