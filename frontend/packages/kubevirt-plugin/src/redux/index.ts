import { combineReducers } from 'redux';
import createVmWizardReducers from '../components/create-vm-wizard/redux/reducers';

export default combineReducers({
  createVmWizards: createVmWizardReducers,
});
