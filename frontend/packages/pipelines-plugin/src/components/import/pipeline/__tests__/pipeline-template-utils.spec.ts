import { GitImportFormData } from '@console/dev-console/src/components/import/import-types';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import {
  PIPELINE_RUNTIME_LABEL,
  PIPELINE_RUNTIME_VERSION_LABEL,
  PIPELINE_STRATEGY_LABEL,
} from '../../../../const';
import { PipelineModel } from '../../../../models';
import { PipelineKind } from '../../../../types';
import {
  createPipelineForImportFlow,
  isDockerPipeline,
  pipelineRuntimeOrVersionChanged,
  updatePipelineForImportFlow,
  getPipelineParams,
} from '../pipeline-template-utils';

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

const getDefaultLabel = (name: string) => ({
  'app.kubernetes.io/instance': name,
  'app.kubernetes.io/name': name,
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe('createPipelineForImportFlow', () => {
  const createFormData = (pipelineTemplate: PipelineKind): GitImportFormData => {
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
    const pipelineTemplate: PipelineKind = {
      metadata: {
        labels: {
          [PIPELINE_RUNTIME_LABEL]: 'nodejs',
        },
      },
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
      '14-ubi8',
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: {
          ...getDefaultLabel('an-app'),
          [PIPELINE_RUNTIME_LABEL]: 'nodejs',
          [PIPELINE_RUNTIME_VERSION_LABEL]: '14-ubi8',
        },
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
    const pipelineTemplate: PipelineKind = {
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
      '14-ubi8',
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: {
          ...getDefaultLabel('an-app'),
          [PIPELINE_RUNTIME_VERSION_LABEL]: '14-ubi8',
        },
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
    const pipelineTemplate: PipelineKind = {
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
      '14-ubi8',
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: {
          ...getDefaultLabel('an-app'),
          [PIPELINE_RUNTIME_VERSION_LABEL]: '14-ubi8',
        },
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
    const pipelineTemplate: PipelineKind = {
      spec: {
        params: [
          { name: 'APP_NAME' },
          { name: 'GIT_REPO' },
          { name: 'GIT_REVISION' },
          { name: 'PATH_CONTEXT', default: '.' },
          { name: 'IMAGE_NAME' },
          { name: 'VERSION' },
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
      '14-ubi8',
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: {
          ...getDefaultLabel('an-app'),
          [PIPELINE_RUNTIME_VERSION_LABEL]: '14-ubi8',
        },
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
          { name: 'VERSION', default: '14-ubi8' },
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
    const pipelineTemplate: PipelineKind = {
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
      '14-ubi8',
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'an-app',
        namespace: 'a-project',
        labels: {
          ...getDefaultLabel('an-app'),
          [PIPELINE_RUNTIME_VERSION_LABEL]: '14-ubi8',
        },
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
  const mockTemplate: PipelineKind = {
    metadata: {
      labels: { 'app.kubernetes.io/instance': 'sample' },
    },
    spec: {
      tasks: [],
      params: [{ type: 'string', name: 'PARAM1' }],
    },
  };

  const mockPipeline: PipelineKind = {
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
    image: { tag: '10-ubi7' },
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
      props.image.tag,
    );

    const expectedPipeline: PipelineKind = {
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
      props.image.tag,
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'test',
        labels: { 'app.kubernetes.io/instance': 'sample' },
        resourceVersion: 'test',
      },
      spec: {
        tasks: [],
        params: [{ name: 'PARAM1', type: 'string' }],
      },
    };

    expect(k8sUpdate).toHaveBeenCalledTimes(1);
    expect(k8sUpdate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, 'test', 'test');
  });

  it('should update VERSION params if image tag is changed', async () => {
    const template = {
      ...mockTemplate,
      spec: { tasks: [], params: [{ name: 'VERSION', default: 'latest' }] },
    };
    await updatePipelineForImportFlow(
      mockPipeline,
      template,
      props.name,
      props.namespace,
      props.gitUrl,
      props.gitRef,
      props.gitDir,
      props.dockerfilePath,
      '14-ubi8',
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'test',
        labels: { 'app.kubernetes.io/instance': 'sample' },
        resourceVersion: 'test',
      },
      spec: {
        tasks: [],
        params: [{ name: 'VERSION', default: '14-ubi8' }],
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
      props.image.tag,
    );

    const expectedPipeline: PipelineKind = {
      metadata: {
        name: 'test',
        namespace: 'test',
        labels: {
          [PIPELINE_RUNTIME_LABEL]: 'newImage',
          [PIPELINE_RUNTIME_VERSION_LABEL]: props.image.tag,
          'app.kubernetes.io/instance': 'test',
          'app.kubernetes.io/name': 'test',
        },
        resourceVersion: 'test',
      },
      spec: {
        tasks: [],
        params: [{ name: 'PARAM1', type: 'string' }],
      },
    };

    expect(k8sUpdate).toHaveBeenCalledTimes(1);
    expect(k8sUpdate).toHaveBeenCalledWith(PipelineModel, expectedPipeline, 'test', 'test');
  });
});

describe('isDockerPipeline', () => {
  const mockTemplate: PipelineKind = {
    metadata: {
      labels: { 'app.kubernetes.io/instance': 'sample' },
    },
    spec: {
      tasks: [],
      params: [{ type: 'string', name: 'PARAM1' }],
    },
  };

  it('should return false for a non docker based pipelines', () => {
    expect(isDockerPipeline(mockTemplate)).toBe(false);
  });

  it('should return true for a docker based pipeline template', () => {
    const template = {
      ...mockTemplate,
      metadata: {
        labels: {
          ...mockTemplate.metadata.labels,
          [PIPELINE_STRATEGY_LABEL]: 'docker',
        },
      },
    };

    expect(isDockerPipeline(template)).toBe(true);
  });
});

describe('pipelineRuntimeOrVersionChanged', () => {
  const mockTemplate: PipelineKind = {
    metadata: {
      labels: {
        [PIPELINE_RUNTIME_LABEL]: 'nodejs',
        [PIPELINE_RUNTIME_VERSION_LABEL]: '10-ubi8',
      },
    },
    spec: {
      tasks: [],
      params: [{ type: 'string', name: 'PARAM1' }],
    },
  };

  it('should return false if runtime and version is same for two given pipelines', () => {
    const mockPipeline = {
      ...mockTemplate,
      metadata: {
        labels: {
          [PIPELINE_RUNTIME_LABEL]: 'nodejs',
          [PIPELINE_RUNTIME_VERSION_LABEL]: '10-ubi8',
        },
      },
    };
    expect(pipelineRuntimeOrVersionChanged(mockTemplate, mockPipeline)).toBe(false);
  });

  it('should return false if runtime or version is different for two given pipelines', () => {
    const mockPipeline = {
      ...mockTemplate,
      metadata: {
        labels: {
          [PIPELINE_RUNTIME_LABEL]: 'nodejs',
          [PIPELINE_RUNTIME_VERSION_LABEL]: '14-ubi8',
        },
      },
    };
    expect(pipelineRuntimeOrVersionChanged(mockTemplate, mockPipeline)).toBe(true);
  });
});

describe('getPipelineParams', () => {
  it('should contain the application name in APP_NAME param if app name is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'APP_NAME', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/', // git Dir
        '', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([{ name: 'APP_NAME', default: 'my-app' }]);
  });

  it('should contain the repository url in GIT_REPO param if repo is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'GIT_REPO', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/', // git Dir
        '', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([{ name: 'GIT_REPO', default: 'https://github.com/owner/repo' }]);
  });

  it('should contain empty string in GIT_REVISION param when gitRef is undefined or null', () => {
    expect(
      getPipelineParams(
        [{ name: 'GIT_REVISION', default: '' }],
        'name',
        'namespace',
        'gitUrl',
        undefined, // git ref
        'gitDir',
        'dockerfilePath',
        'tag',
      ),
    ).toEqual([{ name: 'GIT_REVISION', default: '' }]);

    expect(
      getPipelineParams(
        [{ name: 'GIT_REVISION', default: '' }],
        'name',
        'namespace',
        'gitUrl',
        null, // git ref
        'gitDir',
        'dockerfilePath',
        'tag',
      ),
    ).toEqual([{ name: 'GIT_REVISION', default: '' }]);
  });

  it('should return empty object if params is invalid or not an array', () => {
    expect(
      getPipelineParams(
        null,
        'name',
        'namespace',
        'gitUrl',
        'gitRef',
        'gitDir',
        'dockerfilePath',
        'tag',
      ),
    ).toEqual([]);
    expect(
      getPipelineParams(
        undefined,
        'name',
        'namespace',
        'gitUrl',
        'gitRef',
        'gitDir',
        'dockerfilePath',
        'tag',
      ),
    ).toEqual([]);
  });

  it('should contain empty string in GIT_REVISION param when gitRef is not passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'GIT_REVISION', default: '' }],
        'name',
        'namespace',
        'gitUrl',
        '', // git ref
        'gitDir',
        'dockerfilePath',
        'tag',
      ),
    ).toEqual([{ name: 'GIT_REVISION', default: '' }]);
  });

  it('should contain the branch name in GIT_REVISION param when gitRef is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'GIT_REVISION', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/', // git Dir
        '', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([{ name: 'GIT_REVISION', default: 'main' }]);
  });

  it('should contain the context directory path in PATH_CONTEXT param if git directory is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'PATH_CONTEXT', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/frontend', // git Dir
        '', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([{ name: 'PATH_CONTEXT', default: 'frontend' }]);
  });

  it('should contain the image url in  IMAGE_NAME param if image name param is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'IMAGE_NAME', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/frontend', // git Dir
        '', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([
      {
        name: 'IMAGE_NAME',
        default: 'image-registry.openshift-image-registry.svc:5000/my-namespace/my-app',
      },
    ]);
  });

  it('should contain the docker path in  DOCKERFILE param if it is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'DOCKERFILE', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/frontend', // git Dir
        '/dockerpath', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([
      {
        name: 'DOCKERFILE',
        default: '/dockerpath',
      },
    ]);
  });

  it('should contain the tag in VERSION param if it is passed', () => {
    expect(
      getPipelineParams(
        [{ name: 'VERSION', default: '' }],
        'my-app',
        'my-namespace',
        'https://github.com/owner/repo',
        'main', // git ref
        '/frontend', // git Dir
        '/dockerpath', // dockerfilePath
        '0.1', // tag
      ),
    ).toEqual([
      {
        name: 'VERSION',
        default: '0.1',
      },
    ]);
  });

  it('should return params that are passed', () => {
    const pipelineParams = [
      { name: 'APP_NAME', default: '' },
      { name: 'GIT_REPO', default: '' },
      { name: 'GIT_REVISION', default: '' },
      { name: 'IMAGE_NAME', default: '' },
      { name: 'DOCKERFILE', default: '' },
      { name: 'VERSION', default: '' },
    ];
    const finalParams = getPipelineParams(
      pipelineParams,
      'my-app',
      'my-namespace',
      'https://github.com/owner/repo',
      'main', // git ref
      '/frontend', // git Dir
      '/dockerpath', // dockerfilePath
      '0.1', // tag
    );

    expect(finalParams).toHaveLength(pipelineParams.length);

    finalParams.forEach((p) => {
      const foundParam = pipelineParams.find((pipelineParam) => pipelineParam.name === p.name);
      expect(foundParam).toBeTruthy();
    });
  });
});
