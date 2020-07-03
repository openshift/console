import { combineReducers } from 'redux';
import cloudShellReducer, { cloudShellReducerName } from './reducers/cloud-shell-reducer';
import guidedTourReducer, { guidedTourReducerName } from './reducers/guided-tour-reducer';

export default combineReducers({
  [cloudShellReducerName]: cloudShellReducer,
  [guidedTourReducerName]: guidedTourReducer,
});
