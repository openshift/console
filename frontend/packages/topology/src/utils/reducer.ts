import { combineReducers } from 'redux';
import filterReducer from '../redux/reducer';

export default combineReducers({
  topology: filterReducer,
});
