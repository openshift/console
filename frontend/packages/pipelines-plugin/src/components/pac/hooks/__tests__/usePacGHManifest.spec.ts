import { act } from 'react-dom/test-utils';
import { k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import { routeELData } from '../../../../test-data/pac-data';
import { usePacGHManifest } from '../usePacGHManifest';

const k8sListMock = k8sListResourceItems as jest.Mock;

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => {
  const originalModule = (jest as any).requireActual('@console/dynamic-plugin-sdk/src/utils/k8s');
  return {
    ...originalModule,
    k8sListResourceItems: jest.fn(),
  };
});

describe('usePacGHManifest', () => {
  beforeEach(() => {
    k8sListMock.mockReturnValue(Promise.resolve([routeELData]));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return manifestData with webhook url and loaded true if eventlistener url is fetched', async () => {
    const { result, rerender } = testHook(() => usePacGHManifest());
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.manifestData).toBeDefined();
    expect(result.current.manifestData.hook_attributes.url).toEqual('https://www.example.com');
  });

  it('should return manifestData with webhook url as empty string and loaded true if eventlistener url is not present', async () => {
    k8sListMock.mockReturnValue(Promise.resolve([]));
    const { result, rerender } = testHook(() => usePacGHManifest());
    await act(async () => {
      rerender();
    });
    expect(result.current.loaded).toBe(true);
    expect(result.current.manifestData).toBeDefined();
    expect(result.current.manifestData.hook_attributes.url).toEqual('');
  });
});
