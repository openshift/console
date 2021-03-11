import { combineReducers } from 'redux';
import createVmWizardReducers from '../components/create-vm-wizard/redux/reducers';
import authorizedSSHKeys from '../components/ssh-service/redux/reducer';

export default combineReducers({
  createVmWizards: createVmWizardReducers,
  authorizedSSHKeysReducer: authorizedSSHKeys,
});
