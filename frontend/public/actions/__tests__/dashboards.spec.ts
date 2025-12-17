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
});
