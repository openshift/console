import { applyMiddleware, combineReducers, createStore, compose, ReducersMapObject } from 'redux';
import * as _ from 'lodash-es';

import { featureReducer, featureReducerName, FeatureState } from './reducers/features';
import { monitoringReducer, monitoringReducerName, MonitoringState } from './reducers/monitoring';
import k8sReducers, { K8sState } from './reducers/k8s';
import UIReducers, { UIState } from './reducers/ui';
import { dashboardsReducer, DashboardsState } from './reducers/dashboards';
import { registry } from './plugins';
import { isReduxReducer } from '@console/plugin-sdk';

const composeEnhancers =
  // eslint-disable-next-line no-undef
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

/**
 * This is the entirety of the `redux-thunk` library.
 * It hasn't changed since 2016 and has problems with it's TypeScript definitions (https://github.com/reduxjs/redux-thunk/issues/231), so just including it here.
 */
function createThunkMiddleware(extraArgument?) {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
(thunk as any).withExtraArgument = createThunkMiddleware;

export type RootState = {
  k8s: K8sState;
  UI: UIState;
  [featureReducerName]: FeatureState;
  [monitoringReducerName]: MonitoringState;
  dashboards: DashboardsState;
  plugins?: {
    [namespace: string]: any;
  };
};

const baseReducers = Object.freeze({
  k8s: k8sReducers, // data
  UI: UIReducers,
  [featureReducerName]: featureReducer,
  [monitoringReducerName]: monitoringReducer,
  dashboards: dashboardsReducer,
});

const store = createStore(
  combineReducers<RootState>(baseReducers),
  {},
  composeEnhancers(applyMiddleware(thunk)),
);

const addPluginListener = () => {
  const getReduxFlagsObject = () => {
    const gatingFlags = registry.getGatingFlagNames([isReduxReducer]);
    const featureState = store.getState()[featureReducerName];
    return featureState ? _.pick(featureState.toObject(), gatingFlags) : null;
  };

  let flagsObject = getReduxFlagsObject();

  store.subscribe(() => {
    const currentFlagsObject = getReduxFlagsObject();

    if (JSON.stringify(flagsObject) !== JSON.stringify(currentFlagsObject)) {
      flagsObject = currentFlagsObject;

      const pluginReducerExtensions = registry
        .getReduxReducers()
        .filter((e) => registry.isExtensionInUse(e, flagsObject));

      const pluginReducers: ReducersMapObject = pluginReducerExtensions.reduce((map, e) => {
        map[e.properties.namespace] = e.properties.reducer;
        return map;
      }, {});

      const nextReducers: ReducersMapObject<RootState> = _.isEmpty(pluginReducers)
        ? baseReducers
        : { plugins: combineReducers(pluginReducers), ...baseReducers };

      store.replaceReducer(combineReducers<RootState>(nextReducers));
    }
  });
};

addPluginListener();

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  (window as any).store = store;
}

export default store;
