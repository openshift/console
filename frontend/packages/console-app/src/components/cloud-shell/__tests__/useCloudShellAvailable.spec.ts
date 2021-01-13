import { act } from 'react-dom/test-utils';
import useCloudShellAvailable from '../useCloudShellAvailable';
import { checkTerminalAvailable } from '../cloud-shell-utils';
import { useFlag } from '@console/shared';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';

const useFlagMock = useFlag as jest.Mock;
const checkTerminalAvailableMock = checkTerminalAvailable as jest.Mock;

jest.mock('../cloud-shell-utils', () => {
  return {
    checkTerminalAvailable: jest.fn<Promise<void>>(),
  };
});

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn<boolean>(),
  };
});

describe('useCloudShellAvailable', () => {
  it('should unavailable if flag is unavailable', () => {
    useFlagMock.mockReturnValue(false);
    const { result } = testHook(() => useCloudShellAvailable());
    expect(result.current).toBe(false);
  });

  it('should be unavailable if flag is set but service is unavailable', async () => {
    useFlagMock.mockReturnValue(true);
    checkTerminalAvailableMock.mockReturnValue(Promise.reject());
    const { result, rerender } = testHook(() => useCloudShellAvailable());
    await act(async () => {
      rerender();
    });
    expect(result.current).toBe(false);
  });

  it('should be available if flag is set and service is available', async () => {
    useFlagMock.mockReturnValue(true);
    checkTerminalAvailableMock.mockReturnValue(Promise.resolve());
    const { result, rerender } = testHook(() => useCloudShellAvailable());

    await act(async () => {
      rerender();
    });
    expect(result.current).toBe(true);
  });
});
