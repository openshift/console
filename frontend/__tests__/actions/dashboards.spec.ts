import { Map as ImmutableMap } from 'immutable';

import {
  watchURL,
  ActionType,
  stopWatchURL,
  stopWatchPrometheusQuery,
  watchPrometheusQuery,
} from '../../public/actions/dashboards';
import { defaults } from '../../public/reducers/dashboards';
import { RESULTS_TYPE } from '../../public/redux-types';

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
  const getState = jasmine
    .createSpy('getState')
    .and.returnValues(
      { dashboards: ImmutableMap(defaults) },
      { dashboards: ImmutableMap(defaults).setIn([type, key, 'active'], 1) },
    );
  const dispatch = jasmine.createSpy('dispatch');

  watchAction(key)(dispatch, getState);
  expect(dispatch).toHaveBeenCalledTimes(2);
  expect(dispatch.calls.all()[0].args[0]).toEqual({
    payload: {
      key,
      type,
    },
    type: ActionType.ActivateWatch,
  });
  expect(dispatch.calls.all()[1].args[0]).toEqual({
    payload: {
      key,
      type,
      inFlight: true,
    },
    type: ActionType.UpdateWatchInFlight,
  });
};

const testIncrementActiveWatch = (watchAction, type, key) => {
  const getState = jasmine
    .createSpy('getState')
    .and.returnValue({ dashboards: ImmutableMap(defaults).setIn([type, key, 'active'], 1) });
  const dispatch = jasmine.createSpy('dispatch');

  watchAction(key)(dispatch, getState);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch.calls.all()[0].args[0]).toEqual({
    payload: {
      key,
      type,
    },
    type: ActionType.ActivateWatch,
  });
};

describe('dashboards-actions', () => {
  afterEach(function() {
    window.SERVER_FLAGS.prometheusBaseURL = undefined;
  });

  it('watchURL starts watching URL', () => testStartWatch(watchURL, RESULTS_TYPE.URL, 'fooURL'));

  it('watchPrometheusQuery starts watching Query', () => {
    window.SERVER_FLAGS.prometheusBaseURL = 'prometheusBaseURL';
    testStartWatch(watchPrometheusQuery, RESULTS_TYPE.PROMETHEUS, 'fooQuery');
  });

  it('watchPrometheusQuery sets error if base url is not available', () => {
    const getState = jasmine
      .createSpy('getState')
      .and.returnValue({ dashboards: ImmutableMap(defaults) });
    const dispatch = jasmine.createSpy('dispatch');

    watchPrometheusQuery('fooQuery')(dispatch, getState);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.calls.all()[1].args[0]).toEqual({
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
