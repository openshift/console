import { merge } from 'lodash';
import { getRandomChars } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { PipelineTask, TektonTaskSpec, TaskKind, TektonTaskSteps } from '../../../../types';
import { initialPipelineFormData } from '../const';
import { validationSchema } from '../validation-utils';

export const createSafeTask = (name = `name-${getRandomChars()}`): PipelineTask => ({
  name,
  taskRef: {
    name: 'not-a-real-task',
  },
});

const taskSpecTemplate: TektonTaskSteps[] = [
  {
    name: 'echo',
    image: 'ubuntu',
    command: ['echo'],
    args: ['$(params.some-value-that-does-not-break-tests)'],
  },
];
const embeddedTaskTemplate: TektonTaskSpec = {
  steps: taskSpecTemplate,
};
const externalTaskTemplate: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'ClusterTask',
  metadata: {
    name: 'external-task',
  },
  spec: {
    params: [],
    steps: taskSpecTemplate,
  },
};
export const externalTask = externalTaskTemplate;
export const externalTaskNoDefaultParam = merge({}, externalTaskTemplate, {
  spec: { params: [{ name: 'echo-value' }] },
});
export const externalTaskWithDefaultParam = merge({}, externalTaskTemplate, {
  spec: { params: [{ name: 'echo-value-with-default', default: 'some value' }] },
});
export const externalTaskWitEmptyDefaultParam = merge({}, externalTaskTemplate, {
  spec: { params: [{ name: 'echo-value-with-default', default: '' }] },
});
export const externalTaskWithVarietyParams = merge({}, externalTaskTemplate, {
  spec: {
    params: [
      { name: 'param-with-description', description: 'some useful description' },
      { name: 'param-with-default', default: 'default-value' },
      { name: 'param-with-neither' },
      { name: 'param-with-both', description: 'this is the cool one', default: 'some-default' },
      { name: 'array-param-without-default', type: 'array' },
      { name: 'array-param-with-default', type: 'array', default: ['one', 'two'] },
    ],
  },
});
export const embeddedTaskSpec = embeddedTaskTemplate;

const externalTaskWithResourcesTemplate: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'ClusterTask',
  metadata: {
    name: 'external-task-with-resources',
  },
  spec: {
    resources: {
      inputs: [{ name: 'source-git', type: 'git' }],
      outputs: [{ name: 'source-image', type: 'image' }],
    },
    steps: [
      {
        name: 'manage-credentials',
        image: 'ubuntu',
        command: ['echo'],
        args: [
          'Logging in on behalf of $(params.username).\n\nUsername: kube:admin\nPassword: *********\n\nCredentials verified successfully.',
        ],
      },
      {
        name: 'pull-repo',
        image: 'ubuntu',
        command: ['echo'],
        args: ['git clone $(resources.inputs.source-git.url)'],
      },
    ],
  },
};
export const resourceTask = externalTaskWithResourcesTemplate;

const externalTaskWithWorkspacesTemplate: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'ClusterTask',
  metadata: {
    name: 'external-task-with-workspace',
  },
  spec: {
    workspaces: [
      {
        name: 'output',
        description: 'The git repo will be cloned onto the volume backing this workspace',
      },
      {
        name: 'second',
        description: 'secondness',
      },
    ],
    steps: [
      {
        name: 'clone',
        image: 'gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/git-init:v0.14.2',
        script: ['echo "hello"'],
      },
    ],
  },
};
export const workspaceTask = externalTaskWithWorkspacesTemplate;

// Helper test methods for .then/.catch invocations
export const hasResults = (results) => expect(results).toBeTruthy(); // success for .then
export const shouldHaveFailed = (success) => expect(success).toBe('should have failed'); // failure for .then
export const hasError = (yupPath: string, errorMessage: string) => (error) => {
  if (!error?.inner) {
    // Not a yup validation object, do a bad comparison so the test echos it
    expect(error).toBe('Not a Yup Error, see following error message for the actual error.');
    return;
  }

  const errors: { path: string; message: string }[] = error.inner.map((err) => ({
    path: err.path,
    message: err.message,
  }));
  const expectedError = { path: yupPath, message: errorMessage };
  expect(errors).toEqual(expect.arrayContaining([expect.objectContaining(expectedError)]));
};
export const shouldHavePassed = (err) => expect(err).toBe('should not have this error'); // failure for .catch

export const withFormData = (formData, taskResources?) =>
  validationSchema().validate({
    editorType: EditorType.Form,
    yamlData: '',
    formData,
    taskResources: {
      clusterTasks: [],
      namespacedTasks: [],
      ...(taskResources || {}),
      tasksLoaded: !!taskResources,
    },
  });

export const formDataBasicPassState = {
  ...initialPipelineFormData,
  tasks: [createSafeTask()],
};
