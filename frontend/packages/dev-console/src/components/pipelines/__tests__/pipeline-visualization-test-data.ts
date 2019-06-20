import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';

export const mockPipelineGraph: PipelineVisualizationTaskItem[][] = [
  [
    {
      name: 'start-app',
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
      taskRef: {
        name: 'start-app',
      },
    },
  ],
  [
    {
      name: 'test-app-1',
      resources: {
        inputs: [
          {
            from: ['start-app'],
            name: 'workspace-git',
            resource: 'mapit-git',
          },
        ],
      },
      taskRef: {
        name: 'test-app-1',
      },
    },
    {
      name: 'test-app-2',
      resources: {
        inputs: [
          {
            from: ['start-app'],
            name: 'workspace-git',
            resource: 'mapit-git',
          },
        ],
      },
      taskRef: {
        name: 'test-app-2',
      },
    },
  ],
  [
    {
      name: 'build-image-1',
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
            from: ['build-app'],
            name: 'workspace-git',
            resource: 'mapit-git',
          },
        ],
        outputs: [
          {
            name: 'image',
            resource: 'mapit-image',
          },
        ],
      },
      runAfter: ['test-app-1', 'test-app-2'],
      taskRef: {
        name: 'build-image-1',
      },
    },
    {
      name: 'build-image-2',
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
            from: ['build-app'],
            name: 'workspace-git',
            resource: 'mapit-git',
          },
        ],
        outputs: [
          {
            name: 'image',
            resource: 'mapit-image',
          },
        ],
      },
      runAfter: ['test-app-1', 'test-app-2'],
      taskRef: {
        name: 'build-image-2',
      },
    },
  ],
  [
    {
      name: 'deploy',
      runAfter: ['build-image-1', 'build-image-2'],
      taskRef: {
        name: 'openshift-cli-deploy-mapit',
      },
    },
  ],
];
