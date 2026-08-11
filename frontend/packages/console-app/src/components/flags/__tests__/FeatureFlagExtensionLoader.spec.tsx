import { act, renderHook } from '@testing-library/react';
import { Map as ImmutableMap } from 'immutable';
import { setFlag } from '@console/internal/actions/flags';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useFeatureFlagController } from '../FeatureFlagExtensionLoader';

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: jest.fn(),
}));

jest.mock('@console/internal/actions/flags', () => ({
  ...jest.requireActual('@console/internal/actions/flags'),
  setFlag: jest.fn((flag: string, value: boolean) => ({
    type: 'setFlag',
    payload: { flag, value },
  })),
}));

const mockDispatch = jest.fn();
const mockUseSelector = useConsoleSelector as jest.Mock;
const mockUseDispatch = useConsoleDispatch as jest.Mock;
const mockSetFlag = setFlag as jest.MockedFunction<typeof setFlag>;

describe('useFeatureFlagController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseSelector.mockReturnValue(ImmutableMap());
  });

  it('defers flag updates made during render until after layout effects', () => {
    const { result } = renderHook(() => {
      const setFeatureFlag = useFeatureFlagController();
      // Simulate console.flag/hookProvider handlers that set flags during render.
      setFeatureFlag('SYNC_FLAG', true);
      return setFeatureFlag;
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockSetFlag).toHaveBeenCalledWith('SYNC_FLAG', true);
    expect(result.current).toEqual(expect.any(Function));
  });

  it('dispatches async flag updates immediately without waiting for another render', () => {
    const { result } = renderHook(() => useFeatureFlagController());

    mockDispatch.mockClear();
    mockSetFlag.mockClear();

    act(() => {
      result.current('ASYNC_FLAG', true);
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockSetFlag).toHaveBeenCalledWith('ASYNC_FLAG', true);
  });

  it('does not redispatch when the flag already has the requested value', () => {
    mockUseSelector.mockReturnValue(ImmutableMap({ EXISTING_FLAG: true }));
    const { result } = renderHook(() => useFeatureFlagController());

    mockDispatch.mockClear();

    act(() => {
      result.current('EXISTING_FLAG', true);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
