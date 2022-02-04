import { applyMiddleware, combineReducers, createStore, compose, ReducersMapObject } from 'redux';
import * as _ from 'lodash-es';
import thunk from 'redux-thunk';
import {
  ResolvedExtension,
  ReduxReducer,
  SDKReducers,
  SDKStoreState,
} from '@console/dynamic-plugin-sdk';
import { FeatureSubStore } from '@console/dynamic-plugin-sdk/src/app/features';
import { featureReducer, featureReducerName } from './reducers/features';
import ObserveReducers, { ObserveState } from './reducers/observe';
import UIReducers, { UIState } from './reducers/ui';
import { dashboardsReducer, DashboardsState } from './reducers/dashboards';

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

const baseReducers = Object.freeze({
  observe: ObserveReducers,
  UI: UIReducers,
  [featureReducerName]: featureReducer,
  dashboards: dashboardsReducer,
  ...SDKReducers,
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
