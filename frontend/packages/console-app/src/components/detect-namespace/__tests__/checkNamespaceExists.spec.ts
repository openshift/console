import { k8sGet } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { checkNamespaceExists } from '../checkNamespaceExists';

jest.mock('@console/internal/module/k8s', () => ({
  k8sGet: jest.fn(),
}));

const k8sGetMock = k8sGet as jest.Mock;

const namespace: string = 'ns';

describe('getValueForNamespace', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return false if namespace is not defined', async () => {
    k8sGetMock.mockReturnValueOnce(Promise.resolve());
    const exists = await checkNamespaceExists(null, true);

    expect(exists).toBeFalsy();
  });

  it(`should return true if namespace is equal to ${ALL_NAMESPACES_KEY}`, async () => {
    const exists = await checkNamespaceExists(ALL_NAMESPACES_KEY, true);

    expect(k8sGetMock).toHaveBeenCalledTimes(0);
    expect(exists).toBeTruthy();
  });

  it('should return true if namespace exists', async () => {
    k8sGetMock.mockReturnValueOnce(Promise.resolve());
    const exists = await checkNamespaceExists(namespace, true);

    expect(exists).toBeTruthy();
  });

  it('should return false if namespace does not exists', async () => {
    k8sGetMock.mockReturnValueOnce(Promise.reject());
    const exists = await checkNamespaceExists(namespace, true);

    expect(exists).toBeFalsy();
  });
});
