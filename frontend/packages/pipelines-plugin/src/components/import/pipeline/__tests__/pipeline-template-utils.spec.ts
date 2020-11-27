import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { GitImportFormData } from '@console/dev-console/src/components/import/import-types';
import { PipelineModel } from '../../../../models';
import { PIPELINE_RUNTIME_LABEL } from '../../../../const';
import {
  createPipelineForImportFlow,
  updatePipelineForImportFlow,
} from '../pipeline-template-utils';
import { Pipeline } from '../../../../utils/pipeline-augment';

jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn(),
  k8sUpdate: jest.fn(),
}));
jest.mock('../../../pipelines/pipeline-resource/pipelineResource-utils', () => ({
  createPipelineResource: jest.fn(),
}));
jest.mock('../../../pipelines/modals/common/utils', () => ({
  convertPipelineToModalData: jest.fn(),
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
      docker: {
        dockerfilePath: '',
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

    const formData = createFormData(pipelineTemplate);
    await createPipelineForImportFlow(
      formData.name,
      formData.project.name,
      formData.git.url,
      formData.git.ref,
      formData.git.dir,
      formData.pipeline,
      formData.docker.dockerfilePath,
    );

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

    const formData = createFormData(pipelineTemplate);
    await createPipelineForImportFlow(
      formData.name,
      formData.project.name,
      formData.git.url,
      formData.git.ref,
      formData.git.dir,
      formData.pipeline,
      formData.docker.dockerfilePath,
    );

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

    const formData = createFormData(pipelineTemplate);
    await createPipelineForImportFlow(
      formData.name,
      formData.project.name,
      formData.git.url,
      formData.git.ref,
      formData.git.dir,
      formData.pipeline,
      formData.docker.dockerfilePath,
    );

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

    const formData = createFormData(pipelineTemplate);
    await createPipelineForImportFlow(
      formData.name,
      formData.project.name,
      formData.git.url,
      formData.git.ref,
      formData.git.dir,
      formData.pipeline,
      formData.docker.dockerfilePath,
    );

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
          { name: 'DOCKERFILE' },
        ],
        tasks: [],
      },
    };

    const formData = createFormData(pipelineTemplate);
    await createPipelineForImportFlow(
      formData.name,
      formData.project.name,
      formData.git.url,
      formData.git.ref,
      '/anotherpath',
      formData.pipeline,
      'Dockerfile',
    );

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
          {
            name: 'DOCKERFILE',
            default: 'Dockerfile',
          },
        ],
        tasks: [],
      },
    };

    expect(k8sCreate).toHaveBeenCalledTimes(1);
    expect(k8sCreate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, {
      ns: 'a-project',
    });
  });
});

describe('updatePipelineForImportFlow', () => {
  const mockTemplate: Pipeline = {
    metadata: {
      labels: { 'app.kubernetes.io/instance': 'sample' },
    },
    spec: {
      tasks: [],
      params: [{ type: 'paramtype', name: 'PARAM1' }],
    },
  };

  const mockPipeline: Pipeline = {
    metadata: {
      name: 'test',
      labels: { 'app.kubernetes.io/instance': 'sample' },
      resourceVersion: 'test',
    },
    spec: {
      tasks: [],
      params: [],
    },
  };

  const props = {
    pipelineData: {
      enabled: true,
      data: mockPipeline,
      template: mockTemplate,
    },
    name: 'test',
    namespace: 'test',
    gitUrl: '',
    gitRef: '',
    gitDir: '',
    dockerfilePath: '',
  };

  it('should dissociate pipeline if template is not available', async () => {
    await updatePipelineForImportFlow(
      mockPipeline,
      null,
      props.name,
      props.namespace,
      props.gitUrl,
      props.gitRef,
      props.gitDir,
      props.dockerfilePath,
    );

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'test',
        labels: {},
        resourceVersion: 'test',
      },
      spec: {
        tasks: [],
        params: [],
      },
    };

    expect(k8sUpdate).toHaveBeenCalledTimes(1);
    expect(k8sUpdate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, 'test', 'test');
  });

  it('should update params if template is of same type', async () => {
    await updatePipelineForImportFlow(
      mockPipeline,
      mockTemplate,
      props.name,
      props.namespace,
      props.gitUrl,
      props.gitRef,
      props.gitDir,
      props.dockerfilePath,
    );

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'test',
        labels: { 'app.kubernetes.io/instance': 'sample' },
        resourceVersion: 'test',
      },
      spec: {
        tasks: [],
        params: [{ name: 'PARAM1', type: 'paramtype' }],
      },
    };

    expect(k8sUpdate).toHaveBeenCalledTimes(1);
    expect(k8sUpdate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, 'test', 'test');
  });

  it('should update pipeline if template is of different type', async () => {
    const template = { ...mockTemplate };
    template.metadata.labels[PIPELINE_RUNTIME_LABEL] = 'newImage';
    await updatePipelineForImportFlow(
      mockPipeline,
      mockTemplate,
      props.name,
      props.namespace,
      props.gitUrl,
      props.gitRef,
      props.gitDir,
      props.dockerfilePath,
    );

    const expectedPipeline: Pipeline = {
      metadata: {
        name: 'test',
        namespace: 'test',
        labels: {
          [PIPELINE_RUNTIME_LABEL]: 'newImage',
          'app.kubernetes.io/instance': 'test',
        },
        resourceVersion: 'test',
      },
      spec: {
        tasks: [],
        params: [{ name: 'PARAM1', type: 'paramtype' }],
      },
    };

    expect(k8sUpdate).toHaveBeenCalledTimes(1);
    expect(k8sUpdate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, 'test', 'test');
  });
});
