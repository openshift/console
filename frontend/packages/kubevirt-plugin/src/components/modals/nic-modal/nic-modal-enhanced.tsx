import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { k8sPatch, referenceForModel } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { getName, getNamespace } from '@console/shared';
import { getLoadedData } from '../../../utils';
import { getInterfaces, getUsedNetworks, asVM, getVMLikeModel } from '../../../selectors/vm';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getUpdateNICPatches } from '../../../k8s/patches/vm/vm-nic-patches';
import { getSimpleName } from '../../../selectors/utils';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';
import { NICModal } from './nic-modal';

const NICModalFirehoseComponent: React.FC<NICModalFirehoseComponentProps> = (props) => {
  const { nic, network, vmLikeEntity, vmLikeEntityLoading, isVMRunning, ...restProps } = props;

  const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity); // default old snapshot before loading a new one
  const vm = asVM(vmLikeFinal);

  const nicWrapper = new NetworkInterfaceWrapper(nic);
  const networkWrapper = new NetworkWrapper(network);

  const usedNetworksChoices = getUsedNetworks(vm);

  const usedInterfacesNames: Set<string> = new Set(
    getInterfaces(vm)
      .map(getSimpleName)
      .filter((n) => n && n !== nicWrapper.getName()),
  );

  const allowPodNetwork =
    networkWrapper.isPodNetwork() ||
    !usedNetworksChoices.find((usedNetwork) => usedNetwork.isPodNetwork());

  const onSubmit = (
    resultNetworkInterfaceWrapper: NetworkInterfaceWrapper,
    resultNetworkWrapper: NetworkWrapper,
  ) =>
    k8sPatch(
      getVMLikeModel(vmLikeEntity),
      vmLikeEntity,
      getUpdateNICPatches(vmLikeEntity, {
        nic: new NetworkInterfaceWrapper(nicWrapper, true)
          .mergeWith(resultNetworkInterfaceWrapper)
          .asResource(),
        network: new NetworkWrapper(networkWrapper, true)
          .mergeWith(resultNetworkWrapper)
          .asResource(),
        oldNICName: nicWrapper.getName(),
        oldNetworkName: networkWrapper.getName(),
      }),
    );

  return (
    <NICModal
      {...restProps}
      usedInterfacesNames={usedInterfacesNames}
      allowPodNetwork={allowPodNetwork}
      nic={new NetworkInterfaceWrapper(nicWrapper, true)}
      network={new NetworkWrapper(networkWrapper, true)}
      onSubmit={onSubmit}
      isVMRunning={isVMRunning}
    />
  );
};

type NICModalFirehoseComponentProps = ModalComponentProps & {
  nic?: any;
  network?: any;
  isEditing?: boolean;
  nads?: FirehoseResult;
  vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  vmLikeEntity: VMLikeEntityKind;
  isVMRunning?: boolean;
};

const NICModalFirehose: React.FC<NICModalFirehoseProps> = (props) => {
  const { hasNADs, vmLikeEntity, isVMRunning, ...restProps } = props;

  const namespace = getNamespace(vmLikeEntity);
  const name = getName(vmLikeEntity);

  const resources: FirehoseResource[] = [
    {
      name,
      namespace,
      kind: getVMLikeModel(vmLikeEntity).kind,
      isList: false,
      prop: 'vmLikeEntityLoading',
    },
  ];

  if (hasNADs) {
    resources.push({
      namespace,
      kind: referenceForModel(NetworkAttachmentDefinitionModel),
      isList: true,
      prop: 'nads',
      optional: true,
    });
  }

  return (
    <Firehose resources={resources}>
      <NICModalFirehoseComponent
        vmLikeEntity={vmLikeEntity}
        isVMRunning={isVMRunning}
        {...restProps}
      />
    </Firehose>
  );
};

type NICModalFirehoseProps = ModalComponentProps & {
  vmLikeEntity: VMLikeEntityKind;
  nic?: any;
  network?: any;
  isEditing?: boolean;
  hasNADs: boolean;
  isVMRunning?: boolean;
};

const nicModalStateToProps = ({ k8s }) => {
  // FIXME: This should be a flag.
  const hasNADs = !!k8s.getIn([
    'RESOURCES',
    'models',
    referenceForModel(NetworkAttachmentDefinitionModel),
  ]);
  return {
    hasNADs,
  };
};

const NICModalConnected = connect(nicModalStateToProps)(NICModalFirehose);

export const nicModalEnhanced = createModalLauncher(NICModalConnected);
