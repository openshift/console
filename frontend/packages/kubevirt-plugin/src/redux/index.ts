import { combineReducers } from 'redux';

import createVmWizardReducers from '../components/create-vm-wizard/redux/reducers';
import authorizedSSHKeysReducer from '../components/ssh-service/redux/reducer';

export default combineReducers({
  createVmWizards: createVmWizardReducers,
  authorizedSSHKeys: authorizedSSHKeysReducer,
});
