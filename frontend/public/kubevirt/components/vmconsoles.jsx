import React from 'react';
import { VncConsole } from '@patternfly/react-console';

import { getLabelMatcher, getResourceKind, getVncConnectionDetails, getFlattenForKind, findVMI, isVmiRunning } from './utils/resources';
import { Firehose } from './utils/okdutils';

import { VirtualMachineInstanceModel } from '../models';

const VmIsNotRunning = () => (
  <div className="co-m-pane__body">
    Please start the VM prior accessing its console.
  </div>
);

/**
 * Actual component for consoles.
 */
const VmConsoles = ({ vmi }) => {
  if (!isVmiRunning(vmi)) {
    return <VmIsNotRunning />;
  }

  const vncConDetails = getVncConnectionDetails(vmi);
  return (
    <div className="co-m-pane__body">
      <VncConsole {...vncConDetails} />
    </div>
  );
};

/**
 * Helper component to keep VmConsoles dependent on VMI only.
 */
const FirehoseVmConsoles = props => {
  const data = props.flatten(props.resources);
  const vmi = props.filter(data);
  return <VmConsoles vmi={vmi} />;
};

/**
 * Wrapper for VmConsoles performing asynchronous loading of API resources.
 */
const VmConsolesConnected = ({ obj: vm }) => {
  const vmiResources = getResourceKind(VirtualMachineInstanceModel, vm.metadata.name, true, vm.metadata.namespace, true, getLabelMatcher(vm));
  return (
    <Firehose resources={[vmiResources]} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
      <FirehoseVmConsoles filter={data => findVMI(data, vm.metadata.name)} />
    </Firehose>
  );
};

export default VmConsolesConnected;
