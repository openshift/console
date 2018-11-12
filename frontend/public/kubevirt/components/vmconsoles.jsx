import React from 'react';

import { getLabelMatcher, getResourceKind, getVncConnectionDetails, getSerialConsoleConnectionDetails, getFlattenForKind, findVMI } from './utils/resources';

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
  const data = props.flatten(props.resources);
  const vmi = props.filter(data);
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
  const vmiResources = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  return (
    <Firehose resources={[vmiResources]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
      <FirehoseVmConsoles vm={vm} filter={data => findVMI(data, vm.metadata.name)} />
    </Firehose>
  );
};

export default VmConsolesConnected;
