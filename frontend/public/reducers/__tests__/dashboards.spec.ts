import { noop } from 'lodash';
import {
  activateWatch,
  updateWatchTimeout,
  updateWatchInFlight,
  stopWatch,
  setData,
} from '../../actions/dashboards';
import { RESULTS_TYPE } from '../dashboard-results';
import { dashboardsReducer, defaults } from '../dashboards';

describe('dashboardsReducer', () => {
  it('returns default values if state is uninitialized', () => {
    const newState = dashboardsReducer(null, null);

    expect(newState).toEqual({ ...defaults });
  });

  it('activates new watch', () => {
    const action = activateWatch(RESULTS_TYPE.URL, 'fooUrl');
    const initialState = { ...defaults };
    const newState = dashboardsReducer(initialState, action);

    expect(newState).toEqual({
      ...initialState,
      [RESULTS_TYPE.URL]: { fooUrl: { active: 1 } },
    });
  });

  it('increments watch active prop', () => {
    const action = activateWatch(RESULTS_TYPE.URL, 'fooUrl');
    const initialState = {
      ...defaults,
      [RESULTS_TYPE.URL]: { fooUrl: { active: 1 } },
    };

    const newState = dashboardsReducer(initialState, action);
    expect(newState).toEqual({
      ...initialState,
      [RESULTS_TYPE.URL]: { fooUrl: { active: 2 } },
    });
  });

  it('updates watch timeout reference', () => {
    const timeout = { ref: noop, refresh: noop, unref: noop } as unknown as ReturnType<
      typeof setTimeout
    >;
    const action = updateWatchTimeout(RESULTS_TYPE.URL, 'fooUrl', timeout);
    const initialState = { ...defaults };
    const stateWithTimeout = dashboardsReducer(initialState, action);

    expect(stateWithTimeout).toEqual({
      ...initialState,
      [RESULTS_TYPE.URL]: { fooUrl: { timeout } },
    });

    const nextTimeout = { ref: noop, refresh: noop, unref: noop } as unknown as ReturnType<
      typeof setTimeout
    >;
    const nextAction = updateWatchTimeout(RESULTS_TYPE.URL, 'fooUrl', nextTimeout);

    const nextState = dashboardsReducer(stateWithTimeout, nextAction);

    expect(nextState).toEqual({
      ...stateWithTimeout,
      [RESULTS_TYPE.URL]: {
        fooUrl: { ...stateWithTimeout[RESULTS_TYPE.URL].fooUrl, timeout: nextTimeout },
      },
    });
  });

  it('updates in flight resource', () => {
    const action = updateWatchInFlight(RESULTS_TYPE.URL, 'fooUrl', true);
    const initialState = { ...defaults };
    const stateInFlight = dashboardsReducer(initialState, action);

    expect(stateInFlight).toEqual({
      ...initialState,
      [RESULTS_TYPE.URL]: { fooUrl: { inFlight: true } },
    });

    const nextAction = updateWatchInFlight(RESULTS_TYPE.URL, 'fooUrl', false);
    const nextState = dashboardsReducer(stateInFlight, nextAction);

    expect(nextState).toEqual({
      ...stateInFlight,
      [RESULTS_TYPE.URL]: {
        fooUrl: { ...stateInFlight[RESULTS_TYPE.URL].fooUrl, inFlight: false },
      },
    });
  });

  it('stops watch', () => {
    const timeout = { ref: noop, refresh: noop, unref: noop } as unknown as ReturnType<
      typeof setTimeout
    >;
    const action = stopWatch(RESULTS_TYPE.URL, 'fooUrl');
    const initialState = {
      ...defaults,
      [RESULTS_TYPE.URL]: { fooUrl: { active: 2, timeout } },
    };
    const newState = dashboardsReducer(initialState, action);

    expect(newState).toEqual({
      ...initialState,
      [RESULTS_TYPE.URL]: { fooUrl: { active: 1, timeout } },
    });

    const nextState = dashboardsReducer(newState, action);
    expect(nextState).toEqual({
      ...newState,
      [RESULTS_TYPE.URL]: { fooUrl: { active: 0, timeout } },
    });
  });

  it('updates result', () => {
    const action = setData(RESULTS_TYPE.URL, 'fooUrl', 'result');
    const initialState = { ...defaults };
    const newState = dashboardsReducer(initialState, action);

    expect(newState).toEqual({
      ...initialState,
      [RESULTS_TYPE.URL]: { fooUrl: { data: 'result', loadError: null } },
    });

    const nextAction = setData(RESULTS_TYPE.URL, 'fooUrl', 'newResult');
    const nextState = dashboardsReducer(newState, nextAction);
    expect(nextState).toEqual({
      ...newState,
      [RESULTS_TYPE.URL]: { fooUrl: { data: 'newResult', loadError: null } },
    });
  });
});
