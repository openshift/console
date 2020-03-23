import { iGetIn } from '../../../../utils/immutable';
import { VMWizardTab } from '../../types';
import { iGetCreateVMWizardTabs } from './common';

export const iGetNetworks = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.NETWORKING, 'value']);

export const hasNetworksChanged = (prevState, state, id: string) => {
  const prevINetworks = iGetNetworks(prevState, id);
  const iNetworks = iGetNetworks(state, id);

  return (
    (!prevINetworks && !iNetworks) ||
    prevINetworks?.size !== iNetworks?.size ||
    !!prevINetworks.find(
      (prevINetwork, prevINetworkIndex) => prevINetwork !== iNetworks.get(prevINetworkIndex),
    )
  );
};
