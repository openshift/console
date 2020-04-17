import { iGet } from '../../../../utils/immutable';
import { getCreateVMWizards } from '../wizards';

export const iGetCreateVMWizard = (state, reduxID: string) =>
  iGet(getCreateVMWizards(state), reduxID);
export const iGetCreateVMWizardTabs = (state, reduxID: string) =>
  iGet(iGetCreateVMWizard(state, reduxID), 'tabs');
