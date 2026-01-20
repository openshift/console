import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { usePerspectiveDetection } from '../perspective';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('usePerspectiveDetection', () => {
  it('should return loading as true if CAN_GET_NS flag is pending', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      CAN_GET_NS: undefined,
    }));

    const { result } = renderHook(() => usePerspectiveDetection());
    const [enablePerspective, loading] = result.current;

    expect(enablePerspective).toBe(true);
    expect(loading).toBe(true);
  });

  it('should return loading as false if CAN_GET_NS flag is loaded', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      CAN_GET_NS: false,
    }));

    const { result } = renderHook(() => usePerspectiveDetection());
    const [enablePerspective, loading] = result.current;

    expect(enablePerspective).toBe(true);
    expect(loading).toBe(false);
  });
});
