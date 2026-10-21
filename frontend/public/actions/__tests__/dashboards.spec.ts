import { Map as ImmutableMap } from 'immutable';

import {
  watchURL,
  ActionType,
  stopWatchURL,
  stopWatchPrometheusQuery,
  watchPrometheusQuery,
} from '../dashboards';
import { defaults } from '../../reducers/dashboards';
import { RESULTS_TYPE } from '../../reducers/dashboard-results';
import { MIN_POLL_DELAY } from '../../components/utils/adaptive-polling';

const testStopWatch = (stopAction, type: RESULTS_TYPE, key: string) => {
  expect(stopAction(key)).toEqual({
    payload: {
      key,
      type,
    },
    type: ActionType.StopWatch,
  });
};

const testStartWatch = (watchAction, type: RESULTS_TYPE, key: string) => {
  const getState = jest
    .fn()
    .mockReturnValueOnce({ dashboards: ImmutableMap(defaults) })
    .mockReturnValueOnce({ dashboards: ImmutableMap(defaults).setIn([type, key, 'active'], 1) });
  const dispatch = jest.fn();

  watchAction(key)(dispatch, getState);
  expect(dispatch).toHaveBeenCalledTimes(2);
  expect(dispatch.mock.calls[0][0]).toEqual({
    payload: {
      key,
      type,
    },
    type: ActionType.ActivateWatch,
  });
  expect(dispatch.mock.calls[1][0]).toEqual({
    payload: {
      key,
      type,
      inFlight: true,
    },
    type: ActionType.UpdateWatchInFlight,
  });
};

const testIncrementActiveWatch = (watchAction, type, key) => {
  const getState = jest
    .fn()
    .mockReturnValue({ dashboards: ImmutableMap(defaults).setIn([type, key, 'active'], 1) });
  const dispatch = jest.fn();

  watchAction(key)(dispatch, getState);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch.mock.calls[0][0]).toEqual({
    payload: {
      key,
      type,
    },
    type: ActionType.ActivateWatch,
  });
};

describe('dashboards-actions', () => {
  afterEach(function () {
    window.SERVER_FLAGS.prometheusBaseURL = undefined;
  });

  it('watchURL starts watching URL', () => testStartWatch(watchURL, RESULTS_TYPE.URL, 'fooURL'));

  it('watchPrometheusQuery starts watching Query', () => {
    window.SERVER_FLAGS.prometheusBaseURL = 'prometheusBaseURL';
    testStartWatch(watchPrometheusQuery, RESULTS_TYPE.PROMETHEUS, 'fooQuery');
  });

  it('watchPrometheusQuery sets error if base url is not available', () => {
    const getState = jest.fn().mockReturnValue({ dashboards: ImmutableMap(defaults) });
    const dispatch = jest.fn();

    watchPrometheusQuery('fooQuery')(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[1][0]).toEqual({
      payload: {
        key: 'fooQuery',
        type: RESULTS_TYPE.PROMETHEUS,
        error: new Error('Prometheus URL is not available'),
      },
      type: ActionType.SetError,
    });
  });

  it('watchURL increments active count for active watch', () =>
    testIncrementActiveWatch(watchURL, RESULTS_TYPE.URL, 'fooURL'));

  it('watchPrometheusQuery increments active count for active watch', () =>
    testIncrementActiveWatch(watchPrometheusQuery, RESULTS_TYPE.PROMETHEUS, 'fooQuery'));

  it('stopWatchURL stops watching URL', () =>
    testStopWatch(stopWatchURL, RESULTS_TYPE.URL, 'fooURL'));

  it('stopWatchPrometheusQuery stops watching Prometheus', () =>
    testStopWatch(stopWatchPrometheusQuery, RESULTS_TYPE.PROMETHEUS, 'fooQuery'));

  describe('adaptive polling', () => {
    let setTimeoutSpy: jest.SpyInstance;

    beforeEach(() => {
      setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      setTimeoutSpy.mockRestore();
      jest.restoreAllMocks();
    });

    const flushPromises = () => new Promise(process.nextTick);

    const setupWatchURL = (fetchMock: jest.Mock) => {
      const activeState = ImmutableMap(defaults).setIn([RESULTS_TYPE.URL, 'testURL', 'active'], 1);
      const getState = jest
        .fn()
        .mockReturnValueOnce({ dashboards: ImmutableMap(defaults) })
        .mockReturnValue({ dashboards: activeState });
      const dispatch = jest.fn();

      watchURL('testURL', fetchMock)(dispatch, getState);
      return { dispatch, getState };
    };

    it('uses MIN_POLL_DELAY for fast responses', async () => {
      const now = 1000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 100);

      const fetchMock = jest.fn().mockResolvedValueOnce({ data: 'test' });
      setupWatchURL(fetchMock);

      await flushPromises();

      const lastSetTimeout = setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1];
      expect(lastSetTimeout[1]).toBe(MIN_POLL_DELAY);
    });

    it('increases delay for slow responses', async () => {
      const now = 1000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 3000);

      const fetchMock = jest.fn().mockResolvedValueOnce({ data: 'test' });
      setupWatchURL(fetchMock);

      await flushPromises();

      const lastSetTimeout = setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1];
      expect(lastSetTimeout[1]).toBe(30000);
    });

    it('does not jump to MAX_POLL_DELAY on first fetch error', async () => {
      const fetchMock = jest.fn().mockRejectedValueOnce(new Error('network error'));
      setupWatchURL(fetchMock);

      await flushPromises();

      const lastSetTimeout = setTimeoutSpy.mock.calls[setTimeoutSpy.mock.calls.length - 1];
      expect(lastSetTimeout[1]).toBe(MIN_POLL_DELAY);
    });
  });
});
