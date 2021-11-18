import { applyMiddleware, combineReducers, createStore, compose, ReducersMapObject } from 'redux';
import * as _ from 'lodash-es';
import thunk from 'redux-thunk';
import { ResolvedExtension, ReduxReducer } from '@console/dynamic-plugin-sdk';
import { featureReducer, featureReducerName, FeatureState } from './reducers/features';
import k8sReducers, { K8sState } from './reducers/k8s';
import UIReducers, { UIState } from './reducers/ui';
import { dashboardsReducer, DashboardsState } from './reducers/dashboards';
import coreReducer from '@console/dynamic-plugin-sdk/src/app/core/reducers/core';
import { CoreState } from '@console/dynamic-plugin-sdk/src/app/redux-types';

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

export type RootState = {
  k8s: K8sState;
  UI: UIState;
  [featureReducerName]: FeatureState;
  dashboards: DashboardsState;
  plugins?: {
    [namespace: string]: any;
  };
  core: CoreState;
};

const baseReducers = Object.freeze({
  k8s: k8sReducers, // data
  UI: UIReducers,
  [featureReducerName]: featureReducer,
  dashboards: dashboardsReducer,
  core: coreReducer,
});

const store = createStore(
  combineReducers<RootState>(baseReducers),
  {},
  composeEnhancers(applyMiddleware(thunk)),
);

export const applyReduxExtensions = (reducerExtensions: ResolvedExtension<ReduxReducer>[]) => {
  const pluginReducers: ReducersMapObject = {};

  reducerExtensions.forEach(({ properties: { scope, reducer } }) => {
    pluginReducers[scope] = reducer;
  });

  const nextReducers: ReducersMapObject<RootState> = _.isEmpty(pluginReducers)
    ? baseReducers
    : { plugins: combineReducers(pluginReducers), ...baseReducers };

  store.replaceReducer(combineReducers<RootState>(nextReducers));
};

if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  window.store = store;
}

export default store;
