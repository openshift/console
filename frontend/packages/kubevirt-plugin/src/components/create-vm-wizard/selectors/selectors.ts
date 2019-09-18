import { get } from 'lodash';
import { Map } from 'immutable';
import { iGetIn, immutableListToShallowJS } from '../../../utils/immutable';
import { VMWizardNetwork, VMWizardNetworkWithWrappers, VMWizardTab } from '../types';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';

export const getCreateVMWizards = (state): Map<string, any> =>
  get(state, ['kubevirt', 'createVmWizards']);

export const getNetworks = (state, id: string): VMWizardNetwork[] =>
  immutableListToShallowJS(
    iGetIn(getCreateVMWizards(state), [id, 'tabs', VMWizardTab.NETWORKING, 'value']),
  );

export const getNetworksWithWrappers = (state, id: string): VMWizardNetworkWithWrappers[] =>
  getNetworks(state, id).map(({ network, networkInterface, ...rest }) => ({
    networkInterfaceWrapper: NetworkInterfaceWrapper.initialize(networkInterface),
    networkWrapper: NetworkWrapper.initialize(network),
    networkInterface,
    network,
    ...rest,
  }));
