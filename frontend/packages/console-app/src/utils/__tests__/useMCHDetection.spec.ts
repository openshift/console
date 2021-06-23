// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { MCH_AVAILABILITY_FLAG } from '../../features';
import useMCHDetection from '../useMCHDetection';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('useMCHDetection', () => {
  it('should return "pending flag" when MCHAVAILABILITY flag is not set', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      [MCH_AVAILABILITY_FLAG]: undefined,
    }));
    testHook(() => {
      const [, isPending] = useMCHDetection();
      expect(isPending).toBe(true);
    });
  });

  it('should return "true" when MCHAVAILABILITY flag is set to true', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      [MCH_AVAILABILITY_FLAG]: true,
    }));
    testHook(() => {
      const [mchFlag, isPending] = useMCHDetection();
      expect(mchFlag).toBe(true);
      expect(isPending).toBe(false);
    });
  });

  it('should return "false" when MCHAVAILABILITY flag is set to false', () => {
    (useSelector as jest.Mock).mockImplementation(() => ({
      [MCH_AVAILABILITY_FLAG]: false,
    }));
    testHook(() => {
      const [mchFlag, isPending] = useMCHDetection();
      expect(mchFlag).toBe(false);
      expect(isPending).toBe(false);
    });
  });
});
