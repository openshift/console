import * as React from 'react';
import { AccessConsoles, VncConsole } from '@patternfly/react-console';
import { Button } from '@patternfly/react-core';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';
import { getNamespace } from '@console/shared';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import {
  findRDPService,
  getRdpConnectionDetails,
  getSerialConsoleConnectionDetails,
  getVncConnectionDetails,
  isVMIRunning,
  isGuestAgentConnected,
  SerialConsoleConnectionDetailsType,
  RDPConnectionDetailsType,
  VNCConnectionDetailsType,
} from '../../selectors/vmi';
import { getVMStatus } from '../../statuses/vm/vm';
import { getLoadedData, getResource } from '../../utils';
import { findVMIPod } from '../../selectors/pod/selectors';
import { isVMStarting, isWindows, asVM, isVM, isVMI } from '../../selectors/vm';
import { VMIKind, VMKind } from '../../types/vm';
import { menuActionStart } from './menu-actions';
import { SerialConsoleConnector } from './serial-console-connector';
import { DesktopViewerSelector } from './desktop-viewer-selector';
import { VMTabProps } from './types';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

const { VNC_CONSOLE_TYPE } = AccessConsoles.constants;

const VMIsDown: React.FC<VMIsDownProps> = ({ onStartVm }) => {
  const action = (
    <Button variant="link" onClick={onStartVm}>
      start
    </Button>
  );

  return (
    <div className="co-m-pane__body">
      <div className="kubevirt-vm-consoles__loading">
        This Virtual Machine is down. Please {action} it to access its console.
      </div>
    </div>
  );
};

const VMIsStarting: React.FC<VMIsStartingProps> = ({ LoadingComponent }) => (
  <div className="co-m-pane__body">
    <div className="kubevirt-vm-consoles__loading">
      <LoadingComponent />
      This Virtual Machine is still starting up. The console will be available soon.
    </div>
  </div>
);

const VMConsoles: React.FC<VMConsolesProps> = ({
  vm,
  vmi,
  onStartVm,
  vnc,
  serial,
  rdp,
  LoadingComponent,
}) => {
  if (!isVMIRunning(vmi)) {
    return isVMStarting(vm, vmi) ? (
      <VMIsStarting LoadingComponent={LoadingComponent} />
    ) : (
      <VMIsDown onStartVm={onStartVm} />
    );
  }

  const vncServiceManual = (vnc && vnc.manual) || undefined;
  const rdpServiceManual = (rdp && rdp.manual) || undefined;

  const desktopViewverSelector = isWindows(vm) && (
    <DesktopViewerSelector
      vncServiceManual={vncServiceManual}
      rdpServiceManual={rdpServiceManual}
      vm={vm}
      vmi={vmi}
      guestAgent={isGuestAgentConnected(vmi)}
    />
  );

  return (
    <div className="co-m-pane__body">
      <AccessConsoles preselectedType={VNC_CONSOLE_TYPE} disconnectByChange={false}>
        <SerialConsoleConnector {...serial} />
        <VncConsole {...vnc} />
        {desktopViewverSelector}
      </AccessConsoles>
    </div>
  );
};

const VmConsolesWrapper: React.FC<VmConsolesWrapperProps> = (props) => {
  const { vm: vmProp, vmi, pods, migrations, vmImports } = props;
  const vm = asVM(vmProp);
  const services = getLoadedData(props.services);

  const onStartVm = () => {
    const vmStatus = getVMStatus({ vm, vmi, pods, migrations, vmImports });
    menuActionStart(VirtualMachineModel, vm, { vmStatus }).callback();
  };

  let rdp;
  if (isWindows(vm)) {
    const rdpService = findRDPService(vmi, services);
    const launcherPod = findVMIPod(vmi, pods);
    rdp = getRdpConnectionDetails(vmi, rdpService, launcherPod);
  }

  return (
    <VMConsoles
      vm={vm}
      vmi={vmi}
      onStartVm={onStartVm}
      vnc={getVncConnectionDetails(vmi)}
      serial={getSerialConsoleConnectionDetails(vmi)}
      rdp={rdp}
      LoadingComponent={LoadingInline}
    />
  );
};

export const VMConsoleFirehose: React.FC<VMTabProps> = ({
  obj: objProp,
  vm: vmProp,
  vmi: vmiProp,
  vmImports,
  pods,
  migrations,
  customData: { kindObj },
}) => {
  const vm = kindObj === VirtualMachineModel && isVM(objProp) ? objProp : vmProp;
  const vmi = kindObj === VirtualMachineInstanceModel && isVMI(objProp) ? objProp : vmiProp;

  const namespace = getNamespace(vm);

  const resources = [
    // We probably can not simply match on labels but on Service's spec.selector.[kubevirt/vm] to achieve robust pairing VM-Service.
    // So read all services and filter on frontend.
    getResource(ServiceModel, { namespace, prop: 'services' }),
  ];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VmConsolesWrapper
          vm={vm}
          vmi={vmi}
          migrations={migrations}
          pods={pods}
          vmImports={vmImports}
        />
      </Firehose>
    </div>
  );
};

type VmConsolesWrapperProps = {
  vm?: VMKind;
  vmi?: VMIKind;
  services?: FirehoseResult;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
};

type VMConsolesProps = {
  vm: VMKind;
  onStartVm: () => void;
  LoadingComponent: React.ComponentType;
  vmi?: VMIKind;
  vnc?: VNCConnectionDetailsType;
  serial?: SerialConsoleConnectionDetailsType;
  rdp?: RDPConnectionDetailsType;
};

type VMIsDownProps = {
  onStartVm: () => void;
};

type VMIsStartingProps = {
  LoadingComponent: React.ComponentType;
};
