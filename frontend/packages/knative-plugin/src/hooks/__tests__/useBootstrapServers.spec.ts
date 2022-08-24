import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { Kafkas } from '../../utils/__tests__/knative-serving-data';
import { useBootstrapServers } from '../useBootstrapServers';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

describe('useBootstrapServers', () => {
  it('should show Loading bootstrap servers if data is being fetched', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: false },
      kafkaconnections: { data: [], loaded: false },
    });

    const { result } = testHook(() => useBootstrapServers('app-test'));
    expect(result.current).toEqual([
      [{ disabled: true, value: 'Loading bootstrap servers...' }],
      '...',
    ]);
  });

  it('should show error if there was loading error', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true, loadError: { message: 'loading error' } },
      kafkaconnections: { data: [], loaded: true, loadError: { message: 'loading error' } },
    });

    const { result } = testHook(() => useBootstrapServers('app-test'));
    expect(result.current).toEqual([
      [],
      'loading error, loading error. Try adding bootstrap servers manually.',
    ]);
  });

  it('should show bootstrap servers if bootstrapServers are present', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: Kafkas, loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });

    const { result } = testHook(() => useBootstrapServers('app-test'));
    expect(result.current[0]).toHaveLength(5);
    expect(result.current[1]).toEqual('Add bootstrap servers');
  });
});
