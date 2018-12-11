import React from 'react';

import { getResourceKind, getVncConnectionDetails, getSerialConsoleConnectionDetails, getFlattenForKind } from './utils/resources';

import { Firehose } from './utils/okdutils';
import { LoadingInline } from './okdcomponents';
import { WSFactory } from '../module/okdk8s';

import { VirtualMachineInstanceModel, VirtualMachineModel } from '../models';
import { startStopVmModal } from './modals/start-stop-vm-modal';

import { VmConsoles } from 'kubevirt-web-ui-components';

/**
 * Helper component to keep VmConsoles dependent on VMI only.
 */
const FirehoseVmConsoles = props => {
  const vmi = props.flatten(props.resources);
  const vm = props.vm;

  const onStartVm = () => startStopVmModal({
    kind: VirtualMachineModel,
    resource: vm,
    start: true,
  });

  return <VmConsoles vm={vm} vmi={vmi} onStartVm={onStartVm} getVncConnectionDetails={getVncConnectionDetails} getSerialConsoleConnectionDetails={getSerialConsoleConnectionDetails} LoadingComponent={LoadingInline} WSFactory={WSFactory} />;
};

/**
 * Wrapper for VmConsoles performing asynchronous loading of API resources.
 */
const VmConsolesConnected = ({ obj: vm }) => {
  const vmiResource = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, false);
  return (
    <Firehose resources={[vmiResource]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
      <FirehoseVmConsoles vm={vm} />
    </Firehose>
  );
};

export default VmConsolesConnected;
