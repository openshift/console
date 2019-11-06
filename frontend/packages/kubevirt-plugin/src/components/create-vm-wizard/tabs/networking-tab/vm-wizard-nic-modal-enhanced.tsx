import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import {
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardNetworkWithWrappers,
  VMWizardProps,
} from '../../types';
import { NICModal } from '../../../modals/nic-modal';
import { NetworkType } from '../../../../constants/vm';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getNetworksWithWrappers } from '../../selectors/selectors';

const VMWizardNICModal: React.FC<VMWizardNICModalProps> = (props) => {
  const {
    id,
    type,
    namespace,
    hasNADs,
    addUpdateNIC,
    networks,
    networkInterfaceWrapper = NetworkInterfaceWrapper.EMPTY,
    networkWrapper = NetworkWrapper.EMPTY,
    ...restProps
  } = props;

  const usedInterfacesNames: Set<string> = new Set(
    networks
      .map(({ networkInterfaceWrapper: nicWrapper }) => nicWrapper.getName())
      .filter((n) => n && n !== networkInterfaceWrapper.getName()),
  );

  const usedMultusNetworkNames: Set<string> = new Set(
    networks
      .filter(
        ({ networkWrapper: usedNetworkWrapper }) =>
          usedNetworkWrapper.getType() === NetworkType.MULTUS &&
          usedNetworkWrapper.getMultusNetworkName() !== networkWrapper.getMultusNetworkName(),
      )
      .map(({ networkWrapper: usedNetworkWrapper }) => usedNetworkWrapper.getMultusNetworkName()),
  );

  const allowPodNetwork =
    networkWrapper.isPodNetwork() ||
    !networks.find(({ networkWrapper: usedNetworkWrapper }) => usedNetworkWrapper.isPodNetwork());

  const modal = (
    <NICModal
      {...restProps}
      usedInterfacesNames={usedInterfacesNames}
      usedMultusNetworkNames={usedMultusNetworkNames}
      allowPodNetwork={allowPodNetwork}
      nic={networkInterfaceWrapper}
      network={networkWrapper}
      onSubmit={(resultNetworkInterfaceWrapper, resultNetworkWrapper) => {
        addUpdateNIC({
          id,
          type: type || VMWizardNetworkType.UI_INPUT,
          networkInterface: NetworkInterfaceWrapper.mergeWrappers(
            networkInterfaceWrapper,
            resultNetworkInterfaceWrapper,
          ).asResource(),
          network: NetworkWrapper.mergeWrappers(networkWrapper, resultNetworkWrapper).asResource(),
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
  id?: string;
  namespace: string;
  type?: VMWizardNetworkType;
  networkInterfaceWrapper?: NetworkInterfaceWrapper;
  networkWrapper?: NetworkWrapper;
  networks?: VMWizardNetworkWithWrappers[];
  hasNADs: boolean;
  nads?: FirehoseResult<K8sResourceKind[]>;
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
    networks: getNetworksWithWrappers(state, wizardReduxID),
    namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  addUpdateNIC: (network: VMWizardNetwork) => {
    dispatch(vmWizardActions[ActionType.UpdateNIC](wizardReduxID, network));
  },
});

const VMWizardNICModalConnected = connect(
  stateToProps,
  dispatchToProps,
)(VMWizardNICModal);

export const vmWizardNicModalEnhanced = createModalLauncher(VMWizardNICModalConnected);
