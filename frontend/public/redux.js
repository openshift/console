import { applyMiddleware, combineReducers, createStore } from 'redux';
import { reducer as formReducer } from 'redux-form';
import thunk from 'redux-thunk';

import { featureReducers, featureReducerName } from './features';
import k8sReducers from './module/k8s/k8s-reducers';
import UIReducers from './ui/ui-reducers';

const reducers = combineReducers({
  k8s: k8sReducers,
  UI: UIReducers,
  form: formReducer,
  [featureReducerName]: featureReducers,
});

const store = createStore(reducers, {}, applyMiddleware(thunk));
export default store;
