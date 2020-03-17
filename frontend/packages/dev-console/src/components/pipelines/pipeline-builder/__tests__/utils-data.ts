import { TASK_ERROR_STRINGS, TaskErrorType } from '../const';
import { PipelineBuilderFormikValues, ResourceTaskStatus } from '../types';
import { PipelineTaskRef } from '../../../../utils/pipeline-augment';
import { ClusterTaskModel } from '../../../../models';

const MISSING_ALL_RESOURCES = {
  resources: TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
};
const MISSING_PARAMETER_STRING = { params: [{ value: 'Required' }] };
const MISSING_PARAMETER_ARRAY_STRING = { params: [{ value: ['Required'] }] };

export const TASK_ERRORS = {
  NO_ERRORS: [],
  RESOURCES_ALL_MISSING_ERROR: [MISSING_ALL_RESOURCES],
  PARAMETERS_STRING_EMPTY: [MISSING_PARAMETER_STRING],
  PARAMETERS_ARRAY_PARTIALLY_EMPTY: [MISSING_PARAMETER_ARRAY_STRING],
  BOTH_PARAM_AND_RESOURCE_ERRORS: [{ ...MISSING_ALL_RESOURCES, ...MISSING_PARAMETER_STRING }],
};

export const RESOURCES_TASKS_LOADING: ResourceTaskStatus = {
  clusterTasks: null,
  namespacedTasks: null,
};

export const RESOURCE_TASKS_ERRORED: ResourceTaskStatus = {
  clusterTasks: null,
  namespacedTasks: null,
  errorMsg: 'Failed to load namespace Tasks.',
};

export const PIPELINE_REF_REG_TASK: PipelineTaskRef = { name: 'test-task-cli' };
export const PIPELINE_REF_CLUSTER_TASK: PipelineTaskRef = {
  name: 'buildah',
  kind: ClusterTaskModel.kind,
};
export const RESOURCE_TASKS: ResourceTaskStatus = {
  clusterTasks: [
    {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'ClusterTask',
      metadata: {
        name: PIPELINE_REF_CLUSTER_TASK.name,
        ownerReferences: [
          {
            apiVersion: 'operator.tekton.dev/v1alpha1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'Config',
            name: 'cluster',
            uid: '8f260bc9-6092-48b7-8f5e-ad7715a1e134',
          },
        ],
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
          {
            default: 'true',
            description:
              'Verify the TLS on the registry endpoint (for push/pull to a non-TLS registry)',
            name: 'TLSVERIFY',
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
  ],
  namespacedTasks: [
    {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Task',
      metadata: {
        name: PIPELINE_REF_REG_TASK.name,
      },
      spec: {
        params: [
          {
            default: ['help'],
            description: 'The CLI Arguments to run',
            name: 'ARGS',
            type: 'array',
          },
          {
            name: 'required-param',
            description: 'A field that is required',
            type: 'string',
          },
        ],
        steps: [],
      },
    },
  ],
};

export const BUILDER_FORM_DATA_EXAMPLE: PipelineBuilderFormikValues = {
  name: 'test-pipeline',
  tasks: [
    {
      name: 'task-1',
      taskRef: { name: 'test-task-cli' },
      runAfter: ['wont-make-it'],
      params: [
        { name: 'ARGS', value: ['rollout', 'latest', '$(params.image-name)'] },
        { name: 'required-param', value: 'some-value' },
      ],
    },
    {
      name: 'task-2',
      taskRef: { name: 'buildah', kind: ClusterTaskModel.kind },
      runAfter: ['task-1'],
      params: [{ name: 'TLSVERIFY', value: '' }],
      resources: {
        inputs: [{ name: 'source', resource: 'src' }],
        outputs: [{ name: 'image', resource: 'img' }],
      },
    },
  ],
  params: [{ name: 'image-name' }],
  resources: [
    { name: 'src', type: 'git' },
    { name: 'img', type: 'image' },
  ],
  listTasks: [{ name: 'wont-make-it' }],
  clusterTasks: null,
  namespacedTasks: null,
};
