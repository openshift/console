import * as Immutable from 'immutable';
import { noop } from 'lodash-es';

import { dashboardsReducer, defaults, RESULTS_TYPE } from '../../public/reducers/dashboards';
import {
  activateWatch,
  updateWatchTimeout,
  updateWatchInFlight,
  stopWatch,
  setData,
} from '../../public/actions/dashboards';

describe('dashboardsReducer', () => {
  it('returns default values if state is uninitialized', () => {
    const newState = dashboardsReducer(null, null);

    expect(newState).toEqual(Immutable.Map(defaults));
  });

  it('activates new watch', () => {
    const action = activateWatch(RESULTS_TYPE.URL, 'fooUrl');
    const initialState = Immutable.Map(defaults);
    const newState = dashboardsReducer(initialState, action);

    expect(newState).toEqual(initialState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'active'], 1));
  });

  it('increments watch active prop', () => {
    const action = activateWatch(RESULTS_TYPE.URL, 'fooUrl');
    const initialState = Immutable.Map(defaults).setIn([RESULTS_TYPE.URL, 'fooUrl', 'active'], 1);

    const newState = dashboardsReducer(initialState, action);
    expect(newState).toEqual(initialState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'active'], 2));
  });

  it('updates watch timeout reference', () => {
    const timeout = { ref: noop, refresh: noop, unref: noop } as NodeJS.Timer;
    const action = updateWatchTimeout(RESULTS_TYPE.URL, 'fooUrl', timeout);
    const initialState = Immutable.Map(defaults);
    const stateWithTimeout = dashboardsReducer(initialState, action);

    expect(stateWithTimeout).toEqual(
      initialState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'timeout'], timeout),
    );

    const nextTimeout = { ref: noop, refresh: noop, unref: noop } as NodeJS.Timer;
    const nextAction = updateWatchTimeout(RESULTS_TYPE.URL, 'fooUrl', nextTimeout);

    const nextState = dashboardsReducer(stateWithTimeout, nextAction);

    expect(nextState).toEqual(
      stateWithTimeout.setIn([RESULTS_TYPE.URL, 'fooUrl', 'timeout'], nextTimeout),
    );
  });

  it('updates in flight resource', () => {
    const action = updateWatchInFlight(RESULTS_TYPE.URL, 'fooUrl', true);
    const initialState = Immutable.Map(defaults);
    const stateInFlight = dashboardsReducer(initialState, action);

    expect(stateInFlight).toEqual(
      initialState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'inFlight'], true),
    );

    const nextAction = updateWatchInFlight(RESULTS_TYPE.URL, 'fooUrl', false);
    const nextState = dashboardsReducer(stateInFlight, nextAction);

    expect(nextState).toEqual(stateInFlight.setIn([RESULTS_TYPE.URL, 'fooUrl', 'inFlight'], false));
  });

  it('stops watch', () => {
    const timeout = { ref: noop, refresh: noop, unref: noop } as NodeJS.Timer;
    const action = stopWatch(RESULTS_TYPE.URL, 'fooUrl');
    const initialState = Immutable.Map(defaults).merge({
      [RESULTS_TYPE.URL]: { fooUrl: { active: 2, timeout } },
    });
    const newState = dashboardsReducer(initialState, action);

    expect(newState).toEqual(initialState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'active'], 1));

    const nextState = dashboardsReducer(newState, action);
    expect(nextState).toEqual(newState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'active'], 0));
  });

  it('updates result', () => {
    const action = setData(RESULTS_TYPE.URL, 'fooUrl', 'result');
    const initialState = Immutable.Map(defaults);
    const newState = dashboardsReducer(initialState, action);

    expect(newState).toEqual(
      initialState.withMutations((s) =>
        s
          .setIn([RESULTS_TYPE.URL, 'fooUrl', 'data'], 'result')
          .setIn([RESULTS_TYPE.URL, 'fooUrl', 'loadError'], null),
      ),
    );

    const nextAction = setData(RESULTS_TYPE.URL, 'fooUrl', 'newResult');
    const nextState = dashboardsReducer(newState, nextAction);
    expect(nextState).toEqual(newState.setIn([RESULTS_TYPE.URL, 'fooUrl', 'data'], 'newResult'));
  });
});
