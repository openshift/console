import useActivityTick from '../useActivityTick';
import * as cloudShellUtils from '../cloud-shell-utils';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';

describe('useActivityTick', () => {
  beforeEach(() => {
    jest.spyOn(cloudShellUtils, 'sendActivityTick').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should notify if activity occurs after 1 min', () => {
    let mockNow = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
    const sendActivityTickMock = jest
      .spyOn(cloudShellUtils, 'sendActivityTick')
      .mockImplementation(() => {});
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
