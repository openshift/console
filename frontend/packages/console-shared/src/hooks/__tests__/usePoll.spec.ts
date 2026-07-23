import { renderHook, act } from '@testing-library/react';
import { usePoll } from '../usePoll';

describe('usePoll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fire the callback immediately', () => {
    const callback = jest.fn();
    renderHook(() => usePoll(callback, 5000));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should fire the callback on each interval tick', () => {
    const callback = jest.fn();
    renderHook(() => usePoll(callback, 5000));

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    // 1 immediate + 3 interval ticks at 5000ms
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('should not start interval when delay is 0', () => {
    const callback = jest.fn();
    renderHook(() => usePoll(callback, 0));

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clean up the interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const callback = jest.fn();
    const { unmount } = renderHook(() => usePoll(callback, 5000));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
