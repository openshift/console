import { K8sResourceKind } from '@console/internal/module/k8s';

export const mockPipelinesJSON: K8sResourceKind[] = [
  {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'Pipeline',
    metadata: {
      name: 'tutorial-pipeline',
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
          taskRef: {
            name: 'build-skaffold-web',
          },
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
        },
        {
          name: 'deploy-web',
          taskRef: {
            name: 'deploy-web',
          },
          resources: {
            inputs: [
              {
                name: 'source',
                resource: 'source-repo',
              },
              {
                name: 'image',
                resource: 'web-image',
                from: ['build-skaffold-web'],
              },
            ],
          },
          params: [
            {
              name: 'path',
              value:
                '/workspace/source/examples/microservices/leeroy-web/kubernetes/deployment.yaml',
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
        },
      ],
    },
  },
  {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'Pipeline',
    metadata: {
      name: 'complex-pipeline-visuals',
    },
    spec: {
      resources: [
        {
          name: 'mapit-git',
          type: 'git',
        },
        {
          name: 'mapit-image',
          type: 'image',
        },
      ],
      tasks: [
        {
          name: 'start-app',
          taskRef: {
            name: 'start-app',
          },
          resources: {
            inputs: [
              {
                name: 'workspace-git',
                resource: 'mapit-git',
              },
            ],
            outputs: [
              {
                name: 'workspace-git',
                resource: 'mapit-git',
              },
            ],
          },
        },
        {
          name: 'test-app-1',
          taskRef: {
            name: 'test-app-1',
          },
          resources: {
            inputs: [
              {
                name: 'workspace-git',
                resource: 'mapit-git',
                from: ['start-app'],
              },
            ],
          },
        },
        {
          name: 'test-app-2',
          taskRef: {
            name: 'test-app-2',
          },
          resources: {
            inputs: [
              {
                name: 'workspace-git',
                resource: 'mapit-git',
                from: ['start-app'],
              },
            ],
          },
        },
        {
          name: 'build-image-1',
          taskRef: {
            name: 'build-image-1',
          },
          runAfter: ['test-app-1', 'test-app-2'],
          params: [
            {
              name: 'dockerfile',
              value: 'Dockerfile.openjdk',
            },
            {
              name: 'verifyTLS',
              value: 'false',
            },
          ],
          resources: {
            inputs: [
              {
                name: 'workspace-git',
                resource: 'mapit-git',
                from: ['build-app'],
              },
            ],
            outputs: [
              {
                name: 'image',
                resource: 'mapit-image',
              },
            ],
          },
        },
        {
          name: 'build-image-2',
          taskRef: {
            name: 'build-image-2',
          },
          runAfter: ['test-app-1', 'test-app-2'],
          params: [
            {
              name: 'dockerfile',
              value: 'Dockerfile.openjdk',
            },
            {
              name: 'verifyTLS',
              value: 'false',
            },
          ],
          resources: {
            inputs: [
              {
                name: 'workspace-git',
                resource: 'mapit-git',
                from: ['build-app'],
              },
            ],
            outputs: [
              {
                name: 'image',
                resource: 'mapit-image',
              },
            ],
          },
        },
        {
          name: 'deploy',
          taskRef: {
            name: 'openshift-cli-deploy-mapit',
          },
          runAfter: ['build-image-1', 'build-image-2'],
        },
      ],
    },
  },
];
