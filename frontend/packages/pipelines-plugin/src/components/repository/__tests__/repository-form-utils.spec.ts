import { k8sCreateResource, k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { GitProvider } from '@console/git-service';
import { RepositoryModel } from '../../../models';
import {
  createRepositoryName,
  createRepositoryResources,
  detectGitType,
  getPipelineRunDefaultTemplate,
} from '../repository-form-utils';
import { RepositoryFormValues } from '../types';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sCreateResource: jest.fn(),
  k8sGetResource: jest.fn(),
}));

const k8sCreateMock = k8sCreateResource as jest.Mock;
const k8sGetMock = k8sGetResource as jest.Mock;

describe('createRepositoryResources', () => {
  afterEach(jest.resetAllMocks);
  const repoValues: RepositoryFormValues = {
    name: 'test-repo',
    gitUrl: 'https://github.com/sample/repo',
    gitProvider: GitProvider.GITHUB,
    yamlData: '',
    showOverviewPage: false,
    method: 'secret',
    webhook: {
      method: 'token',
      token: '',
      secret: '',
      url: '',
    },
  };
  it('creates only repository CR when no token is provided', async () => {
    await createRepositoryResources(
      {
        ...repoValues,
        name: 'test-repo',
        gitUrl: 'https://github.com/sample/repo',
      },
      'test-ns',
    );
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith({
      model: RepositoryModel,
      ns: 'test-ns',
      data: {
        kind: 'Repository',
        apiVersion: 'pipelinesascode.tekton.dev/v1alpha1',
        metadata: { name: 'test-repo', namespace: 'test-ns' },
        spec: {
          url: 'https://github.com/sample/repo',
          // eslint-disable-next-line @typescript-eslint/camelcase
          git_provider: {},
        },
      },
    });
  });

  it('creates repository CR and secret when token is provided', async () => {
    k8sCreateMock.mockReturnValueOnce({ metadata: { name: 'secret-name' } });
    await createRepositoryResources(
      {
        ...repoValues,
        name: 'test-repo',
        gitUrl: 'https://github.com/sample/repo',
        webhook: {
          ...repoValues.webhook,
          token: 'secretval',
        },
      },
      'test-ns',
    );
    expect(k8sCreateMock).toHaveBeenCalledTimes(2);
    expect(k8sCreateMock).toHaveBeenCalledWith({
      model: RepositoryModel,
      ns: 'test-ns',
      data: expect.objectContaining({
        apiVersion: 'pipelinesascode.tekton.dev/v1alpha1',
        kind: 'Repository',
        metadata: { name: 'test-repo', namespace: 'test-ns' },
        spec: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          git_provider: {
            secret: { key: 'provider.token', name: expect.anything() },
            // eslint-disable-next-line @typescript-eslint/camelcase
            webhook_secret: { key: 'webhook.secret', name: expect.anything() },
          },
          url: 'https://github.com/sample/repo',
        },
      }),
    });
  });

  it('creates repository CR with custom host when repository host is not GitHub', async () => {
    k8sCreateMock.mockReturnValueOnce({ metadata: { name: 'secret-name' } });
    await createRepositoryResources(
      {
        ...repoValues,
        name: 'test-repo',
        gitUrl: 'https://customgithost.com/sample/repo',
      },
      'test-ns',
    );
    expect(k8sCreateMock).toHaveBeenCalledWith({
      model: RepositoryModel,
      ns: 'test-ns',
      data: expect.objectContaining({
        spec: {
          url: 'https://customgithost.com/sample/repo',
          // eslint-disable-next-line @typescript-eslint/camelcase
          git_provider: {
            url: 'customgithost.com',
          },
        },
      }),
    });
  });
});

describe('detectGitType', () => {
  it('should return the correct git provider', () => {
    expect(detectGitType('https://github.com/example/nodejs-ex')).toEqual(GitProvider.GITHUB);
    expect(detectGitType('https://gitlab.com/example/nodejs-ex')).toEqual(GitProvider.GITLAB);
    expect(detectGitType('https://bitbucket.org/example/nodejs-ex')).toEqual(GitProvider.BITBUCKET);
  });

  it('should return git provider as unsure type if it is self hosted', () => {
    expect(detectGitType('https://git.dev/example/nodejs-ex')).toEqual(GitProvider.UNSURE);
    expect(detectGitType('https://dev/example/nodejs-ex')).toEqual(GitProvider.UNSURE);
  });

  it('should return  invalid type', () => {
    expect(detectGitType('')).toEqual(GitProvider.INVALID);
    expect(detectGitType(null)).toEqual(GitProvider.INVALID);
    expect(detectGitType(undefined)).toEqual(GitProvider.INVALID);
    expect(detectGitType('//dev/example/nodejs-ex')).toEqual(GitProvider.INVALID);
  });
});

describe('createRepositoryName', () => {
  fit('should create repository name with prefix', () => {
    expect(createRepositoryName('nodejs-ex')).toEqual('git-nodejs-ex');
    expect(createRepositoryName('ruby-ex')).toEqual('git-ruby-ex');
  });

  fit('should convert and return a valid repo name', () => {
    expect(createRepositoryName('NODEJS1')).toEqual('git-nodejs-1');
    expect(createRepositoryName('RUBY')).toEqual('git-ruby');
  });
});

describe('getPipelineRunDefaultTemplate', () => {
  it('should return default fallback template if a custom template is not available', async () => {
    k8sGetMock.mockReturnValueOnce({});
    const template = await getPipelineRunDefaultTemplate('nodejs-ex');
    expect(template).toEqual(expect.stringContaining('name: nodejs-ex'));
  });

  it('should contain default name if repo name is invalid', async () => {
    k8sGetMock.mockReturnValueOnce({});
    expect(await getPipelineRunDefaultTemplate(null)).toEqual(
      expect.stringContaining('name: pull_request'),
    );
    expect(await getPipelineRunDefaultTemplate(undefined)).toEqual(
      expect.stringContaining('name: pull_request'),
    );
  });

  it('should return custom template', async () => {
    k8sGetMock.mockReturnValueOnce({ data: { template: 'my-custom-template-string' } });
    const template = await getPipelineRunDefaultTemplate('nodejs-ex');
    expect(template).toEqual(expect.stringContaining('my-custom-template-string'));
  });
});
