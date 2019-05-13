import { applyMiddleware, combineReducers, createStore } from 'redux';
import { reducer as formReducer } from 'redux-form';

import { featureReducer, featureReducerName } from './features';
import { monitoringReducer, monitoringReducerName } from './monitoring';
import k8sReducers from './module/k8s/k8s-reducers';
import UIReducers from './ui/ui-reducers';

/**
 * This is the entirety of the `redux-thunk` library.
 * It hasn't changed since 2016 and has problems with it's TypeScript definitions (https://github.com/reduxjs/redux-thunk/issues/231), so just including it here.
 */
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

const reducers = combineReducers({
  k8s: k8sReducers, // data
  UI: UIReducers,
  form: formReducer,
  [featureReducerName]: featureReducer,
  [monitoringReducerName]: monitoringReducer,
});

const store = createStore(reducers, {}, applyMiddleware(thunk));
export default store;

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  window.store = store;
}
