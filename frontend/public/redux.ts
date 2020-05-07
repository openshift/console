import { applyMiddleware, combineReducers, createStore, compose, ReducersMapObject } from 'redux';
import * as _ from 'lodash-es';

import { featureReducer } from './reducers/features';
import { monitoringReducer } from './reducers/monitoring';
import k8sReducers from './reducers/k8s';
import UIReducers from './reducers/ui';
import { dashboardsReducer } from './reducers/dashboards';
import { pluginStore } from './plugins';
import { isReduxReducer, isExtensionInUse, getGatingFlagNames } from '@console/plugin-sdk';
import { RootState } from './redux-types';

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

const baseReducers = Object.freeze({
  k8s: k8sReducers, // data
  UI: UIReducers,
  FLAGS: featureReducer,
  monitoringURLs: monitoringReducer,
  dashboards: dashboardsReducer,
});

const store = createStore(
  combineReducers<RootState>(baseReducers),
  {},
  composeEnhancers(applyMiddleware(thunk)),
);

const addPluginListener = () => {
  const reducerExtensions = pluginStore.getAllExtensions().filter(isReduxReducer);
  const getReduxFlagsObject = () => {
    const gatingFlags = getGatingFlagNames(reducerExtensions);
    const featureState = store.getState().FLAGS;
    return featureState ? _.pick(featureState.toObject(), gatingFlags) : null;
  };

  let flagsObject = getReduxFlagsObject();

  store.subscribe(() => {
    const currentFlagsObject = getReduxFlagsObject();

    if (JSON.stringify(flagsObject) !== JSON.stringify(currentFlagsObject)) {
      flagsObject = currentFlagsObject;

      const pluginReducerExtensions = reducerExtensions.filter((e) =>
        isExtensionInUse(e, flagsObject),
      );

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

if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  window.store = store;
}

export default store;
