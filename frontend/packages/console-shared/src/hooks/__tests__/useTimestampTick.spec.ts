import { renderHook, act } from '@testing-library/react';
import { useTimestampTick } from '../useTimestampTick';

describe('useTimestampTick', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return a number representing current time', () => {
    const { result } = renderHook(() => useTimestampTick());
    expect(typeof result.current).toBe('number');
  });

  it('should update after the tick interval', () => {
    const { result } = renderHook(() => useTimestampTick());
    const initial = result.current;

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current).toBeGreaterThan(initial);
  });

  it('should not update before the tick interval', () => {
    const { result } = renderHook(() => useTimestampTick());
    const initial = result.current;

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(initial);
  });

  it('should clean up interval when unmounted', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useTimestampTick());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('should share one interval across multiple consumers', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const callsBefore = setIntervalSpy.mock.calls.length;

    const { unmount: unmount1 } = renderHook(() => useTimestampTick());
    const { unmount: unmount2 } = renderHook(() => useTimestampTick());

    const callsAfter = setIntervalSpy.mock.calls.length;
    expect(callsAfter - callsBefore).toBe(1);

    unmount1();
    unmount2();
    setIntervalSpy.mockRestore();
  });
});
