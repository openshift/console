import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import * as cloudShellUtils from '../cloud-shell-utils';
import useActivityTick from '../useActivityTick';

jest.mock('../cloud-shell-utils', () => {
  const actual = jest.requireActual('../cloud-shell-utils');
  return {
    ...actual,
    sendActivityTick: jest.fn(),
  };
});

const sendActivityTickMock = cloudShellUtils.sendActivityTick as jest.Mock;

describe('useActivityTick', () => {
  beforeEach(() => {
    sendActivityTickMock.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should notify if activity occurs after 1 min', () => {
    let mockNow = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
    testHook(() => {
      const tick = useActivityTick('testName', 'testNamespace');

      // send initial tick
      tick();
      expect(sendActivityTickMock).toHaveBeenCalledWith('testName', 'testNamespace');
      sendActivityTickMock.mockReset();

      // elapsed time isn't long enough to trigger sending a new tick
      mockNow += 59000;
      tick();

      // reset mock to test count
      expect(sendActivityTickMock).toHaveBeenCalledTimes(0);

      // elapsed time is now long enough to trigger sending a tick
      mockNow += 1000;
      tick();
      expect(sendActivityTickMock).toHaveBeenCalledWith('testName', 'testNamespace');
      expect(sendActivityTickMock).toHaveBeenCalledTimes(1);

      // multiple ticks within the time interval does not result sending tick
      tick();
      tick();
      expect(sendActivityTickMock).toHaveBeenCalledTimes(1);

      // advance time enough to send a tick
      mockNow += 600000;
      tick();
      expect(sendActivityTickMock).toHaveBeenCalledTimes(2);
    });
  });
});
