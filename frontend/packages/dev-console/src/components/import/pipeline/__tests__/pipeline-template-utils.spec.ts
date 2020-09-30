import { k8sCreate } from '@console/internal/module/k8s';
import { Pipeline } from 'packages/dev-console/src/utils/pipeline-augment';
import { PipelineModel } from '../../../../models';
import { GitImportFormData } from '../../import-types';
import { createPipelineResource } from '../../../pipelines/pipeline-resource/pipelineResource-utils';
import { createPipelineForImportFlow } from '../pipeline-template-utils';

jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn(),
}));
jest.mock('../../../pipelines/pipeline-resource/pipelineResource-utils', () => ({
  createPipelineResource: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('createPipelineForImportFlow', () => {
  const createFormData = (pipelineTemplate: Pipeline): GitImportFormData => {
    const minimalFormData = {
      name: 'an-app',
      project: { name: 'a-project' },
      git: {
        type: 'github',
        url: 'https://github.com/openshift/console',
        ref: 'master',
        dir: '/',
        showGitType: true,
        secret: '',
        isUrlValidating: false,
      },
    } as GitImportFormData;
    const formData: GitImportFormData = {
      ...minimalFormData,
      pipeline: {
        enabled: true,
        template: pipelineTemplate,
      },
    };
    return formData;
  };

  it('should create an almost empty pipeline for a template with only task data (empty task)', async () => {
    const pipelineTemplate: Pipeline = {
      spec: {
        tasks: [],
      },
    };

    await createPipelineForImportFlow(createFormData(pipelineTemplate));

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: { 'app.kubernetes.io/instance': 'an-app' },
      },
      spec: {
        params: undefined,
        tasks: [],
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
    expect(createPipelineResource).toHaveBeenCalledTimes(0);
  });

  it('should create a pipeline for a template with params, resources, workspaces, tasks (all empty)', async () => {
    const pipelineTemplate: Pipeline = {
      spec: {
        params: [],
        resources: [],
        workspaces: [],
        tasks: [],
        serviceAccountName: 'service-account',
      },
    };

    await createPipelineForImportFlow(createFormData(pipelineTemplate));

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: { 'app.kubernetes.io/instance': 'an-app' },
      },
      spec: {
        params: [],
        resources: [],
        workspaces: [],
        tasks: [],
        serviceAccountName: 'service-account',
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
    expect(createPipelineResource).toHaveBeenCalledTimes(0);
  });

  it('should create a pipeline for a template with filled params, resources, workspaces and tasks', async () => {
    const pipelineTemplate: Pipeline = {
      spec: {
        params: [{ name: 'a-param', default: 'default value', description: 'a description' }],
        resources: [{ type: 'resource-type', name: 'a-resource' }],
        workspaces: [{ name: 'a-workspace' }],
        tasks: [
          {
            name: 'build',
            taskRef: {
              name: 'a-task',
            },
          },
        ],
      },
    };

    await createPipelineForImportFlow(createFormData(pipelineTemplate));

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: { 'app.kubernetes.io/instance': 'an-app' },
      },
      spec: {
        params: [{ name: 'a-param', default: 'default value', description: 'a description' }],
        resources: [{ type: 'resource-type', name: 'a-resource' }],
        workspaces: [{ name: 'a-workspace' }],
        tasks: [
          {
            name: 'build',
            taskRef: {
              name: 'a-task',
            },
          },
        ],
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
    expect(createPipelineResource).toHaveBeenCalledTimes(0);
  });

  it('should create a pipeline and two resources if the template defines a git and image resources', async () => {
    const pipelineTemplate: Pipeline = {
      spec: {
        params: [],
        resources: [
          { type: 'git', name: 'app-source' },
          { type: 'image', name: 'app-image' },
        ],
        tasks: [],
      },
    };

    const formData = createFormData(pipelineTemplate);
    await createPipelineForImportFlow(formData);

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: { 'app.kubernetes.io/instance': 'an-app' },
      },
      spec: {
        params: [],
        resources: [
          { type: 'git', name: 'app-source' },
          { type: 'image', name: 'app-image' },
        ],
        tasks: [],
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
    expect(createPipelineResource).toHaveBeenCalledTimes(2);
    expect(createPipelineResource).toHaveBeenCalledWith(
      { revision: 'master', url: 'https://github.com/openshift/console' },
      'git',
      'a-project',
    );
    expect(createPipelineResource).toHaveBeenCalledWith(
      { url: 'image-registry.openshift-image-registry.svc:5000/a-project/an-app' },
      'image',
      'a-project',
    );
  });

  it('should fill different pipeline parameters if the template contains known params', async () => {
    const pipelineTemplate: Pipeline = {
      spec: {
        params: [
          { name: 'APP_NAME' },
          { name: 'GIT_REPO' },
          { name: 'GIT_REVISION' },
          { name: 'PATH_CONTEXT', default: '.' },
          { name: 'IMAGE_NAME' },
        ],
        tasks: [],
      },
    };

    await createPipelineForImportFlow(createFormData(pipelineTemplate));

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: { 'app.kubernetes.io/instance': 'an-app' },
      },
      spec: {
        params: [
          { name: 'APP_NAME', default: 'an-app' },
          { name: 'GIT_REPO', default: 'https://github.com/openshift/console' },
          { name: 'GIT_REVISION', default: 'master' },
          { name: 'PATH_CONTEXT', default: '.' },
          {
            name: 'IMAGE_NAME',
            default: 'image-registry.openshift-image-registry.svc:5000/a-project/an-app',
          },
        ],
        tasks: [],
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
    expect(createPipelineResource).toHaveBeenCalledTimes(0);
  });

  it('should remove prefix slash of the git directory from the PATH_CONTEXT param', async () => {
    const pipelineTemplate: Pipeline = {
      spec: {
        params: [
          { name: 'APP_NAME' },
          { name: 'GIT_REPO' },
          { name: 'GIT_REVISION' },
          { name: 'PATH_CONTEXT' },
          { name: 'IMAGE_NAME' },
        ],
        tasks: [],
      },
    };

    const formData = createFormData(pipelineTemplate);
    formData.git.dir = '/anotherpath';
    await createPipelineForImportFlow(formData);

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: { 'app.kubernetes.io/instance': 'an-app' },
      },
      spec: {
        params: [
          { name: 'APP_NAME', default: 'an-app' },
          { name: 'GIT_REPO', default: 'https://github.com/openshift/console' },
          { name: 'GIT_REVISION', default: 'master' },
          { name: 'PATH_CONTEXT', default: 'anotherpath' },
          {
            name: 'IMAGE_NAME',
            default: 'image-registry.openshift-image-registry.svc:5000/a-project/an-app',
          },
        ],
        tasks: [],
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
    expect(createPipelineResource).toHaveBeenCalledTimes(0);
  });
});
