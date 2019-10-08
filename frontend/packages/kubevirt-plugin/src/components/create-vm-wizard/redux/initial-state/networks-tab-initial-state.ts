import { NetworkInterfaceType, NetworkType, POD_NETWORK } from '../../../../constants/vm';

export const podNetwork = {
  rootNetwork: {},
  id: 0,
  name: 'nic0',
  mac: '',
  network: POD_NETWORK,
  editable: true,
  edit: false,
  networkType: NetworkType.POD,
  binding: NetworkInterfaceType.MASQUERADE,
};

export const getNetworksInitialState = () => ({
  value: [podNetwork],
  isValid: true,
  hasAllRequiredFilled: true,
});
