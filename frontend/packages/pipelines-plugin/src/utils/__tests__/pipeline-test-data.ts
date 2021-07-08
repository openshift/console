import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { pipelineTestData, PipelineExampleNames, DataState } from '../../test-data/pipeline-data';
import { PipelineKind } from '../../types';

export const mockPipelinesJSON: PipelineKind[] = [
  {
    apiVersion: 'tekton.dev/v1alpha1',
    kind: 'Pipeline',
    metadata: {
      name: 'tutorial-pipeline',
    },
    spec: {
      params: [
        {
          name: 'APP_NAME',
          description: 'Application name',
          default: 'default-app-name',
        },
      ],
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
        {
          name: 'use-secret',
          taskSpec: {
            steps: [
              {
                name: 'greet',
                image: 'registry.access.redhat.com/ubi8/ubi',
                script: ['#!/usr/bin/env bash', 'echo "Hello world!"'],
              },
            ],
          },
          params: [{ name: 'xyz', value: 'default' }],
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
  {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'Pipeline',
    metadata: {
      name: 'devconsole',
    },
    spec: {
      tasks: [
        {
          name: 'use-secret',
          taskSpec: {
            steps: [
              {
                name: 'greet',
                image: 'registry.access.redhat.com/ubi8/ubi',
                script: ['echo "Hello world!"\n'],
              },
            ],
          },
        },
      ],
    },
  },
];

const specificPipelineData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];
export const constructPipelineData = {
  pipeline: specificPipelineData.pipeline,
  pipelineRuns: [
    specificPipelineData.pipelineRuns[DataState.SUCCESS],
    specificPipelineData.pipelineRuns[DataState.IN_PROGRESS],
    specificPipelineData.pipelineRuns[DataState.CANCELLED1],
    specificPipelineData.pipelineRuns[DataState.CANCELLED2],
    specificPipelineData.pipelineRuns[DataState.CANCELLED3],
  ],
};
export const mockRunDurationTest = [
  pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS],
  pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE].pipelineRuns[DataState.SUCCESS],
  pipelineTestData[PipelineExampleNames.CLUSTER_PIPELINE].pipelineRuns[DataState.SUCCESS],
];

export const pvcWithPipelineOwnerRef: PersistentVolumeClaimKind[] = [
  {
    apiVersion: 'v1',
    kind: PersistentVolumeClaimModel.kind,
    metadata: {
      name: 'pvc1',
      namespace: 'test',
      ownerReferences: [
        { name: 'pipeline1', kind: PipelineRunModel.kind, uid: 'test', apiVersion: 'v1' },
      ],
    },
    spec: {
      accessModes: ['a'],
      resources: { requests: { storage: 'test' } },
      storageClassName: 'test',
    },
  },
  {
    apiVersion: 'v1',
    kind: PersistentVolumeClaimModel.kind,
    metadata: {
      name: 'pvc2',
      namespace: 'test',
      ownerReferences: [
        { name: 'pipeline2', kind: PipelineRunModel.kind, uid: 'test', apiVersion: 'v1' },
      ],
    },
    spec: {
      accessModes: ['a'],
      resources: { requests: { storage: 'test' } },
      storageClassName: 'test',
    },
  },
  {
    apiVersion: 'v1',
    kind: PersistentVolumeClaimModel.kind,
    metadata: {
      name: 'pvc3',
      namespace: 'test',
      ownerReferences: [
        { name: 'pipeline3', kind: PipelineRunModel.kind, uid: 'test', apiVersion: 'v1' },
      ],
    },
    spec: {
      accessModes: ['a'],
      resources: { requests: { storage: 'test' } },
      storageClassName: 'test',
    },
  },
  {
    apiVersion: 'v1',
    kind: PersistentVolumeClaimModel.kind,
    metadata: {
      name: 'pvc-all',
      namespace: 'test',
      ownerReferences: [
        { name: 'pipeline1', kind: PipelineRunModel.kind, uid: 'test', apiVersion: 'v1' },
        { name: 'pipeline2', kind: PipelineRunModel.kind, uid: 'test', apiVersion: 'v1' },
        { name: 'pipeline3', kind: PipelineRunModel.kind, uid: 'test', apiVersion: 'v1' },
      ],
    },
    spec: {
      accessModes: ['a'],
      resources: { requests: { storage: 'test' } },
      storageClassName: 'test',
    },
  },
  {
    apiVersion: 'v1',
    kind: PersistentVolumeClaimModel.kind,
    metadata: {
      name: 'pvc4',
      namespace: 'test',
      ownerReferences: [{ name: 'pipeline5', kind: 'improperkind', uid: 'test', apiVersion: 'v1' }],
    },
    spec: {
      accessModes: ['a'],
      resources: { requests: { storage: 'test' } },
      storageClassName: 'test',
    },
  },
  {
    apiVersion: 'v1',
    kind: PersistentVolumeClaimModel.kind,
    metadata: {
      name: 'pvc5',
      namespace: 'test',
      ownerReferences: [{ name: 'pipeline6', kind: 'improperkind', uid: 'test', apiVersion: 'v1' }],
    },
    spec: {
      accessModes: ['a'],
      resources: { requests: { storage: 'test' } },
      storageClassName: 'test',
    },
  },
];
