// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { usePerspectiveDetection } from '../usePerspectiveDetection';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('usePerspectiveDetection', () => {
  it('should return loading as true if CAN_GET_NS flag is pending', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      CAN_GET_NS: undefined,
    }));

    testHook(() => {
      const [enablePerspective, loading] = usePerspectiveDetection();

      expect(enablePerspective).toBe(true);
      expect(loading).toBe(true);
    });
  });

  it('should return loading as false if CAN_GET_NS flag is loaded', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      CAN_GET_NS: false,
    }));

    testHook(() => {
      const [enablePerspective, loading] = usePerspectiveDetection();

      expect(enablePerspective).toBe(true);
      expect(loading).toBe(false);
    });
  });
});
