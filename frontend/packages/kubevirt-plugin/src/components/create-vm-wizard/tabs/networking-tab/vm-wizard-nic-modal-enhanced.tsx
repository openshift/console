import * as React from 'react';
import { connect } from 'react-redux';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { NICModal } from '../../../modals/nic-modal/nic-modal';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { getNetworks } from '../../selectors/selectors';
import { VMWizardNetwork, VMWizardNetworkType, VMWizardProps } from '../../types';

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

  const allowPodNetwork =
    networkWrapper.isPodNetwork() ||
    !networks.find(({ network: net }) => new NetworkWrapper(net).isPodNetwork());

  const modal = (
    <NICModal
      {...restProps}
      usedInterfacesNames={usedInterfacesNames}
      allowPodNetwork={allowPodNetwork}
      nic={new NetworkInterfaceWrapper(networkInterface, true)}
      network={new NetworkWrapper(network, true)}
      editConfig={{
        ...editConfig,
        acceptEmptyValuesOverride: {
          network: true,
          ...editConfig?.acceptEmptyValuesOverride,
        },
      }}
      onSubmit={(resultNetworkInterfaceWrapper, resultNetworkWrapper) => {
        const finalResultNetworkWrapper = new NetworkWrapper(networkWrapper, true).mergeWith(
          resultNetworkWrapper,
        );

        if (!resultNetworkWrapper.hasType()) {
          finalResultNetworkWrapper.setType(); // clear
        }

        addUpdateNIC({
          ...wizardNetwork,
          type: type || VMWizardNetworkType.UI_INPUT,
          networkInterface: new NetworkInterfaceWrapper(networkInterface, true)
            .mergeWith(resultNetworkInterfaceWrapper)
            .asResource(),
          network: finalResultNetworkWrapper.asResource(),
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
  isEditing?: boolean;
  nads?: FirehoseResult;
  addUpdateNIC: (network: VMWizardNetwork) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  // FIXME: This should be a flag.
  const hasNADs = !!state.sdkK8s.getIn([
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
