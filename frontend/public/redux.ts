import * as _ from 'lodash';
import type { ReducersMapObject } from 'redux';
import { applyMiddleware, combineReducers, createStore, compose } from 'redux';
import { thunk } from 'redux-thunk';
import type { FeatureSubStore } from '@console/dynamic-plugin-sdk/src/app/features';
import { SDKReducers } from '@console/dynamic-plugin-sdk/src/app/redux';
import type { SDKStoreState } from '@console/dynamic-plugin-sdk/src/app/redux-types';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';
import type { ReduxReducer } from '@console/dynamic-plugin-sdk/src/extensions/redux';
import type { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { featureFlagMiddleware } from '@console/internal/plugins';
import type { DashboardsState } from './reducers/dashboards';
import { dashboardsReducer } from './reducers/dashboards';
import { featureReducer, featureReducerName } from './reducers/features';
import type { ObserveState } from './reducers/observe';
import ObserveReducers from './reducers/observe';
import type { UIState } from './reducers/ui';
import UIReducers from './reducers/ui';

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

export type RootState = {
  observe: ObserveState;
  UI: UIState;
  dashboards: DashboardsState;
  plugins?: {
    [namespace: string]: any;
  };
} & SDKStoreState &
  FeatureSubStore;

export const baseReducers = Object.freeze({
  observe: ObserveReducers,
  UI: UIReducers,
  [featureReducerName]: featureReducer,
  dashboards: dashboardsReducer,
  ...SDKReducers,
});

// TODO: Refactor to redux toolkit configureStore
const store = createStore(
  combineReducers(baseReducers),
  {} as RootState,
  composeEnhancers(applyMiddleware(thunk, featureFlagMiddleware)),
);

// Provides redux store object to SDK components that can't import from here
storeHandler.setStore(store);

export const applyReduxExtensions = (reducerExtensions: ResolvedExtension<ReduxReducer>[]) => {
  const pluginReducers: ReducersMapObject = {};

  reducerExtensions.forEach(({ properties: { scope, reducer } }) => {
    pluginReducers[scope] = reducer;
  });

  const nextReducers: ReducersMapObject<RootState> = _.isEmpty(pluginReducers)
    ? baseReducers
    : { plugins: combineReducers(pluginReducers), ...baseReducers };

  store.replaceReducer(combineReducers(nextReducers));
};

if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  window.store = store;
}

export default store;
