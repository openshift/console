import { combineReducers } from 'redux';
import cloudShellReducer, { cloudShellReducerName } from './reducers/cloud-shell-reducer';
import quickStartReducer, { quickStartReducerName } from './reducers/quick-start-reducer';

export default combineReducers({
  [cloudShellReducerName]: cloudShellReducer,
  [quickStartReducerName]: quickStartReducer,
});
