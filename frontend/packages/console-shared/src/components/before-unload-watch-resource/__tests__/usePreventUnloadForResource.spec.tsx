import { act } from 'react-dom/test-utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { usePreventDataLossLock } from '@console/internal/components/utils/router-hooks';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import { usePreventUnloadForResource } from '../usePreventUnloadForResource';

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const usePreventDataLossLockMock = usePreventDataLossLock as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));
jest.mock('@console/internal/components/utils/router-hooks', () => ({
  usePreventDataLossLock: jest.fn(),
}));

describe('usePreventUnloadForResource', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockClear();
    usePreventDataLossLockMock.mockClear();
  });

  it('should call usePreventDataLossLock with lock true', async () => {
    let watchResourceData;
    useK8sWatchResourceMock.mockReturnValue([{ status: { phase: 'Running' } }, true]);
    testHook(() => {
      watchResourceData = usePreventUnloadForResource();
    });
    act(() => {
      watchResourceData(
        {
          kind: 'Build',
          name: 'my-build-1',
          namespace: 'my-app',
        },
        (resData) => ['New', 'Pending', 'Running'].includes(resData.status?.phase),
      );
    });

    expect(usePreventDataLossLockMock).toHaveBeenCalled();
    expect(usePreventDataLossLockMock).toHaveBeenCalledWith(true);
  });

  it('should call usePreventDataLossLock with lock false', () => {
    let watchResourceData;
    useK8sWatchResourceMock.mockReturnValue([null, false, true]);
    testHook(() => {
      watchResourceData = usePreventUnloadForResource();
    });
    act(() => {
      watchResourceData(
        {
          kind: 'Build',
          name: 'my-build-1',
          namespace: 'my-app',
        },
        (resData) => ['New', 'Pending', 'Running'].includes(resData.status?.phase),
      );
    });
    expect(usePreventDataLossLockMock).toHaveBeenCalled();
    expect(usePreventDataLossLockMock).toHaveBeenCalledWith(false);
  });
});
