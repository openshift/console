import { combineReducers } from 'redux';

import createVmWizardReducers from '../components/create-vm-wizard/redux/reducers';
import v2vConfigMapReducer from './reducers/v2v-config-map-reducer';

export default combineReducers({
  createVmWizards: createVmWizardReducers,
  v2vConfigMap: v2vConfigMapReducer,
});
