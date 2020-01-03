import { combineReducers } from 'redux';
import filterReducer from '../components/topology/redux/reducer';

export default combineReducers({
  topology: filterReducer,
});
