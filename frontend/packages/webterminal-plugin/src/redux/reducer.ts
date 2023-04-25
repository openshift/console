import { combineReducers } from 'redux';
import cloudShellReducer from './reducers/cloud-shell-reducer';
import { cloudShellReducerName } from './reducers/cloud-shell-selectors';

export default combineReducers({
  [cloudShellReducerName]: cloudShellReducer,
});
