import { applyMiddleware, combineReducers, createStore } from 'redux';
import { reducer as formReducer } from 'redux-form';
import thunk from 'redux-thunk';

import { featureReducer, featureReducerName } from './features';
import { monitoringReducer, monitoringReducerName } from './monitoring';
import k8sReducers from './module/k8s/k8s-reducers';
import UIReducers from './ui/ui-reducers';

const reducers = combineReducers({
  k8s: k8sReducers, // data
  UI: UIReducers,
  form: formReducer,
  [featureReducerName]: featureReducer,
  [monitoringReducerName]: monitoringReducer,
});

const store = createStore(reducers, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(), applyMiddleware(thunk));
export default store;

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'production') {
  // Expose Redux store for debugging
  window.store = store;
}
