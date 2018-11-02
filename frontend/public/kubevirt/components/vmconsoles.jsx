import React from 'react';
import { VncConsole } from '@patternfly/react-console';
import { Button } from 'patternfly-react';

import { getLabelMatcher, getResourceKind, getVncConnectionDetails, getFlattenForKind, findVMI, isVmiRunning, isVmStarting } from './utils/resources';
import { Firehose } from './utils/okdutils';
import { LoadingInline } from './okdcomponents';

import { VirtualMachineInstanceModel, VirtualMachineModel } from '../models';
import { startStopVmModal } from './modals/start-stop-vm-modal';

const VmIsDown = ({ vm }) => {
  const action = (
    <Button bsStyle="link" onClick={() => startStopVmModal({
      kind: VirtualMachineModel,
      resource: vm,
      start: true
    })}>
      start
    </Button>);

  return (
    <div className="co-m-pane__body">
      <div className="vm-consoles-loading">
        This Virtual Machine is down. Please {action} it to access its console.
      </div>
    </div>

  );
};

const VmIsStarting = () => (
  <div className="co-m-pane__body">
    <div className="vm-consoles-loading">
      <LoadingInline />
      This Virtual Machine is still starting up. The console will be available soon.
    </div>
  </div>
);

/**
 * Once design is stabilized, this will go to pf-react's VncConsole.
 */
const ConsoleType = ({ type }) => (
  <div className="vmconsoles-type">
    <b>Console</b> {type}
  </div>
);

/**
 * Actual component for consoles.
 */
const VmConsoles = ({ vm, vmi }) => {
  if (!isVmiRunning(vmi)) {
    return isVmStarting(vm, vmi) ? <VmIsStarting /> : <VmIsDown vm={vm} />;
  }

  const vncConDetails = getVncConnectionDetails(vmi);
  return (
    <div className="co-m-pane__body">
      <ConsoleType type="VNC" />
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
  const vm = props.vm;
  return <VmConsoles vm={vm} vmi={vmi} />;
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
