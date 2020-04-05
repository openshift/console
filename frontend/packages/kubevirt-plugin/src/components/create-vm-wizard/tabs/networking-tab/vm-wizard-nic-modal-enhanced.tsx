import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { VMWizardNetwork, VMWizardNetworkType, VMWizardProps } from '../../types';
import { NICModal } from '../../../modals/nic-modal/nic-modal';
import { NetworkType } from '../../../../constants/vm';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getNetworks } from '../../selectors/selectors';

const VMWizardNICModal: React.FC<VMWizardNICModalProps> = (props) => {
  const {
    namespace,
    hasNADs,
    addUpdateNIC,
    networks,
    network: wizardNetwork,
    ...restProps
  } = props;
  const { type, network, networkInterface, editConfig } = wizardNetwork || {};
  const networkInterfaceWrapper = new NetworkInterfaceWrapper(networkInterface);
  const networkWrapper = new NetworkWrapper(network);

  const usedInterfacesNames: Set<string> = new Set(
    networks
      .map(({ networkInterface: nic }) => nic?.name)
      .filter((n) => n && n !== networkInterfaceWrapper.getName()),
  );

  const usedMultusNetworkNames: Set<string> = new Set(
    networks
      .filter(({ network: usedNetwork }) => {
        const usedNetworkWrapper = new NetworkWrapper(usedNetwork);
        return (
          usedNetworkWrapper.getType() === NetworkType.MULTUS &&
          usedNetworkWrapper.getMultusNetworkName() !== networkWrapper.getMultusNetworkName()
        );
      })
      .map(({ network: net }) => new NetworkWrapper(net).getMultusNetworkName()),
  );

  const allowPodNetwork =
    networkWrapper.isPodNetwork() ||
    !networks.find(({ network: net }) => new NetworkWrapper(net).isPodNetwork());

  const modal = (
    <NICModal
      {...restProps}
      usedInterfacesNames={usedInterfacesNames}
      usedMultusNetworkNames={usedMultusNetworkNames}
      allowPodNetwork={allowPodNetwork}
      nic={new NetworkInterfaceWrapper(networkInterface, true)}
      network={new NetworkWrapper(network, true)}
      editConfig={editConfig}
      onSubmit={(resultNetworkInterfaceWrapper, resultNetworkWrapper) => {
        addUpdateNIC({
          ...wizardNetwork,
          type: type || VMWizardNetworkType.UI_INPUT,
          networkInterface: new NetworkInterfaceWrapper(networkInterface, true)
            .mergeWith(resultNetworkInterfaceWrapper)
            .asResource(),
          network: new NetworkWrapper(network, true).mergeWith(resultNetworkWrapper).asResource(),
        });
        return Promise.resolve();
      }}
    />
  );
  if (!hasNADs) {
    return modal;
  }

  return (
    <Firehose
      resources={[
        {
          kind: referenceForModel(NetworkAttachmentDefinitionModel),
          isList: true,
          namespace,
          prop: 'nads',
        },
      ]}
    >
      {modal}
    </Firehose>
  );
};

type VMWizardNICModalProps = ModalComponentProps & {
  namespace: string;
  network?: VMWizardNetwork;
  showInitialValidation?: boolean;
  networks?: VMWizardNetwork[];
  hasNADs: boolean;
  nads?: FirehoseResult;
  addUpdateNIC: (network: VMWizardNetwork) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  // FIXME: This should be a flag.
  const hasNADs = !!state.k8s.getIn([
    'RESOURCES',
    'models',
    referenceForModel(NetworkAttachmentDefinitionModel),
  ]);
  return {
    hasNADs,
    networks: getNetworks(state, wizardReduxID),
    namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  addUpdateNIC: (network: VMWizardNetwork) => {
    dispatch(vmWizardActions[ActionType.UpdateNIC](wizardReduxID, network));
  },
});

const VMWizardNICModalConnected = connect(stateToProps, dispatchToProps)(VMWizardNICModal);

export const vmWizardNicModalEnhanced = createModalLauncher(VMWizardNICModalConnected);
