import { combineReducers } from 'redux';
import cloudShellReducer, { cloudShellReducerName } from './reducers/cloud-shell-reducer';

export default combineReducers({
  [cloudShellReducerName]: cloudShellReducer,
});
