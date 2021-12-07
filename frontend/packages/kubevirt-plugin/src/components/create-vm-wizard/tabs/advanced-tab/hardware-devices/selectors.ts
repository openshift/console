import { iGetIn } from '../../../../../utils/immutable';
import { iGetCreateVMWizardTabs } from '../../../selectors/immutable/common';
import { HardwareDevicesField, VMWizardTab } from '../../../types';

export const iGetVmAdvancedSettings = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.ADVANCED, 'value']);

export const iGetHardwareField = (
  state,
  id: string,
  key: HardwareDevicesField,
  defaultValue = undefined,
) => iGetIn(iGetVmAdvancedSettings(state, id), [key, 'value'], defaultValue);
