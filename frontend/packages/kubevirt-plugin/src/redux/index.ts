import { combineReducers } from 'redux';
import createVmWizardReducers from '../components/create-vm-wizard/redux/reducers';
import authorizedSSHKeysReducer from '../components/ssh-service/redux/reducer';
import sysprepReducer from './reducers/sysprep-reducer';
import v2vConfigMapReducer from './reducers/v2v-config-map-reducer';

export default combineReducers({
  createVmWizards: createVmWizardReducers,
  authorizedSSHKeys: authorizedSSHKeysReducer,
  v2vConfigMap: v2vConfigMapReducer,
  sysprep: sysprepReducer,
});
