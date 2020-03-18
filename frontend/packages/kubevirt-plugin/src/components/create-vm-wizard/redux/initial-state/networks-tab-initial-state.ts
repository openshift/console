import { CommonData, VMWizardNetwork, VMWizardNetworkType } from '../../types';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkInterfaceModel, NetworkType } from '../../../../constants/vm/network';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { getSequenceName } from '../../../../utils/strings';
import { InitialStepStateGetter } from './types';

export const podNetwork: VMWizardNetwork = {
  id: '0',
  type: VMWizardNetworkType.UI_DEFAULT_POD_NETWORK,
  networkInterface: NetworkInterfaceWrapper.initializeFromSimpleData({
    name: getSequenceName('nic'),
    model: NetworkInterfaceModel.VIRTIO,
    interfaceType: NetworkType.POD.getDefaultInterfaceType(),
  }).asResource(),
  network: NetworkWrapper.initializeFromSimpleData({
    name: getSequenceName('nic'),
    type: NetworkType.POD,
  }).asResource(),
};

export const getNetworksInitialState: InitialStepStateGetter = (data: CommonData) => ({
  value: [podNetwork],
  error: null,
  hasAllRequiredFilled: true,
  isValid: true,
  isLocked: false,
  isHidden: data.data.isProviderImport && data.data.isSimpleView,
});
