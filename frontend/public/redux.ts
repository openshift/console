import { applyMiddleware, combineReducers, createStore, compose, ReducersMapObject } from 'redux';
import * as _ from 'lodash-es';
import { ReduxReducer, isReduxReducer } from '@console/dynamic-plugin-sdk';
import {
  subscribeToExtensions,
  extensionDiffListener,
} from '@console/plugin-sdk/src/api/subscribeToExtensions';
import { resolveExtension } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { unwrapPromiseSettledResults } from '@console/dynamic-plugin-sdk/src/utils/promise';
import { featureReducer, featureReducerName, FeatureState } from './reducers/features';
import k8sReducers, { K8sState } from './reducers/k8s';
import UIReducers, { UIState } from './reducers/ui';
import { dashboardsReducer, DashboardsState } from './reducers/dashboards';

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

/**
 * This is the entirety of the `redux-thunk` library.
 * It hasn't changed since 2016 and has problems with it's TypeScript definitions
 * (https://github.com/reduxjs/redux-thunk/issues/231), so just including it here.
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
  dashboards: DashboardsState;
  plugins?: {
    [namespace: string]: any;
  };
};

const baseReducers = Object.freeze({
  k8s: k8sReducers, // data
  UI: UIReducers,
  [featureReducerName]: featureReducer,
  dashboards: dashboardsReducer,
});

const store = createStore(
  combineReducers<RootState>(baseReducers),
  {},
  composeEnhancers(applyMiddleware(thunk)),
);

const pluginReducers: ReducersMapObject = {};

subscribeToExtensions<ReduxReducer>(
  extensionDiffListener((added, removed) => {
    removed.forEach(({ properties: { scope } }) => {
      delete pluginReducers[scope];
    });

    Promise.allSettled(added.map(resolveExtension)).then((results) => {
      const [fulfilledValues, rejectedReasons] = unwrapPromiseSettledResults(results);

      fulfilledValues.forEach(({ properties: { scope, reducer } }) => {
        pluginReducers[scope] = reducer;
      });

      if (rejectedReasons.length > 0) {
        // eslint-disable-next-line no-console
        console.error('Failed to resolve Redux reducer extensions', rejectedReasons);
      }

      const nextReducers: ReducersMapObject<RootState> = _.isEmpty(pluginReducers)
        ? baseReducers
        : { plugins: combineReducers(pluginReducers), ...baseReducers };

      store.replaceReducer(combineReducers<RootState>(nextReducers));
    });
  }),
  isReduxReducer,
);

if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  window.store = store;
}

export default store;
