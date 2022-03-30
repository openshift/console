import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { RepositoryModel } from '../../../models';
import { createRepositoryResources } from '../repository-form-utils';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sCreateResource: jest.fn(),
}));

const k8sCreateMock = k8sCreateResource as jest.Mock;

describe('createRepositoryResources', () => {
  afterEach(jest.resetAllMocks);

  it('creates only repository CR when no token is provided', async () => {
    await createRepositoryResources('test-repo', 'test-ns', 'https://github.com/sample/repo');
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
      'test-repo',
      'test-ns',
      'https://github.com/sample/repo',
      'secretval',
    );
    expect(k8sCreateMock).toHaveBeenCalledTimes(2);
    expect(k8sCreateMock).toHaveBeenCalledWith({
      model: RepositoryModel,
      ns: 'test-ns',
      data: expect.objectContaining({
        spec: {
          url: 'https://github.com/sample/repo',
          // eslint-disable-next-line @typescript-eslint/camelcase
          git_provider: {
            secret: {
              name: expect.anything(),
              key: 'token',
            },
          },
        },
      }),
    });
  });

  it('creates repository CR with custom host when repository host is not GitHub', async () => {
    k8sCreateMock.mockReturnValueOnce({ metadata: { name: 'secret-name' } });
    await createRepositoryResources(
      'test-repo',
      'test-ns',
      'https://customgithost.com/sample/repo',
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
