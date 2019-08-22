import { iGetIn } from '../../../../utils/immutable';
import { VMWizardTab } from '../../types';
import { iGetCreateVMWizardTabs } from './selectors';

export const iGetNetworks = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.NETWORKS, 'value']);
