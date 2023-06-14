import { act } from 'react-dom/test-utils';
import { coFetch } from '@console/internal/co-fetch';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import { sampleSecretData } from '../../../../test-data/pac-data';
import { createPACSecret, updatePACInfo } from '../../pac-utils';
import { usePacData } from '../usePacData';

const useK8sGetMock = useK8sGet as jest.Mock;
const coFetchMock = coFetch as jest.Mock;
const createPACSecretMock = createPACSecret as jest.Mock;
const updatePACInfoMock = updatePACInfo as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

jest.mock('@console/internal/co-fetch', () => ({
  coFetch: jest.fn(),
}));

jest.mock('../../pac-utils', () => ({
  createPACSecret: jest.fn(),
  updatePACInfo: jest.fn(),
}));

describe('usePacData', () => {
  beforeEach(() => {
    useK8sGetMock.mockReturnValue([sampleSecretData, true, null]);
    coFetchMock.mockReturnValue(
      Promise.resolve({
        json: () =>
          Promise.resolve({
            name: 'test',
            id: '12',
            pem: 'pemData',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            webhook_secret: 'https://www.example.com',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            html_url: 'https://www.example.com',
          }),
      }),
    );
    createPACSecretMock.mockReturnValue(Promise.resolve(sampleSecretData));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return secretData, loaded true and isFirstSetup as false if secret is fetched', async () => {
    const { result, rerender } = testHook(() => usePacData(undefined));
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.secretData).toBeDefined();
    expect(result.current.isFirstSetup).toBe(false);
    expect(result.current.loadError).toEqual(null);
  });

  it('should return secretData, isFirstSetup as true and as loaded true if new secret is created', async () => {
    useK8sGetMock.mockReturnValue([undefined, true, null]);
    const { result, rerender } = testHook(() => usePacData('1234'));
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.secretData).toBeDefined();
    expect(result.current.isFirstSetup).toBe(true);
    expect(result.current.loadError).toEqual(null);
  });

  it('should update the pipelines-as-code-info configmap', async () => {
    useK8sGetMock.mockReturnValue([undefined, true, null]);
    const { result, rerender } = testHook(() => usePacData('1234'));
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.secretData).toBeDefined();
    expect(result.current.isFirstSetup).toBe(true);
    expect(updatePACInfoMock).toHaveBeenCalledTimes(1);
  });

  it('should return loaded as false if secret fetch call(useK8sGet) is not complete', async () => {
    useK8sGetMock.mockReturnValue([undefined, false, null]);
    const { result, rerender } = testHook(() => usePacData(undefined));
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(false);
    expect(result.current.secretData).toBeUndefined();
  });

  it('should return loaded as true, secretData as undefined and loadError if secret fetch call is complete(useK8sGet) but no secret present', async () => {
    useK8sGetMock.mockReturnValue([undefined, true, { code: 404 }]);
    const { result, rerender } = testHook(() => usePacData(undefined));
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.secretData).toBeUndefined();
  });

  it('should return loaded as true and loadError if any api call fails with code conversion', async () => {
    useK8sGetMock.mockReturnValue([undefined, true, null]);
    coFetchMock.mockReturnValue(Promise.reject(new Error('something unexpected happened')));
    const { result, rerender } = testHook(() => usePacData('1234'));
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.secretData).toBeUndefined();
    expect(result.current.loadError.message).toEqual('something unexpected happened');
  });
});
