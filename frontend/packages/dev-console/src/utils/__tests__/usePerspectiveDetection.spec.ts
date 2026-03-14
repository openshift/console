import { renderHook } from '@testing-library/react';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { usePerspectiveDetection } from '../perspective';

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

describe('usePerspectiveDetection', () => {
  it('should return loading as true if CAN_GET_NS flag is pending', () => {
    (useConsoleSelector as jest.Mock).mockImplementation(() => ({
      CAN_GET_NS: undefined,
    }));

    const { result } = renderHook(() => usePerspectiveDetection());
    const [enablePerspective, loading] = result.current;

    expect(enablePerspective).toBe(true);
    expect(loading).toBe(true);
  });

  it('should return loading as false if CAN_GET_NS flag is loaded', () => {
    (useConsoleSelector as jest.Mock).mockImplementation(() => ({
      CAN_GET_NS: false,
    }));

    const { result } = renderHook(() => usePerspectiveDetection());
    const [enablePerspective, loading] = result.current;

    expect(enablePerspective).toBe(true);
    expect(loading).toBe(false);
  });
});
