import * as React from 'react';
import { AccessConsoles, VncConsole } from '@patternfly/react-console';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';
import { getNamespace } from '@console/shared';
import { PodKind } from '@console/internal/module/k8s';
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
import { getVMStatus } from '../../statuses/vm/vm-status';
import { getLoadedData, getResource } from '../../utils';
import { findVMIPod } from '../../selectors/pod/selectors';
import { isWindows, asVM } from '../../selectors/vm';
import { isVM, isVMI } from '../../selectors/check-type';
import { VMIKind, VMKind } from '../../types/vm';
import { SerialConsoleConnector } from './serial-console-connector';
import { DesktopViewerSelector } from './desktop-viewer-selector';
import { VMTabProps } from './types';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMStatus } from '../../constants/vm/vm-status';

const { VNC_CONSOLE_TYPE } = AccessConsoles.constants;

const VMIsDown: React.FC = () => (
  <div className="co-m-pane__body">
    <div className="kubevirt-vm-consoles__loading">
      This Virtual Machine is down. Please start it to access its console.
    </div>
  </div>
);

const VMIsStarting: React.FC<VMIsStartingProps> = ({ LoadingComponent }) => (
  <div className="co-m-pane__body">
    <div className="kubevirt-vm-consoles__loading">
      <LoadingComponent />
      This Virtual Machine is still starting up. The console will be available soon.
    </div>
  </div>
);

const VMCannotBeStarted: React.FC = () => (
  <div className="co-m-pane__body">
    <div className="kubevirt-vm-consoles__loading">
      This Virtual Machine is down and cannot be started at the moment.
    </div>
  </div>
);

const VMConsoles: React.FC<VMConsolesProps> = ({
  vm,
  vmi,
  vmStatusBundle,
  vnc,
  serial,
  rdp,
  LoadingComponent,
}) => {
  if (!isVMIRunning(vmi)) {
    if (vmStatusBundle?.status?.isImporting() || vmStatusBundle?.status?.isMigrating()) {
      return <VMCannotBeStarted />;
    }

    return vmStatusBundle?.status === VMStatus.STARTING ||
      vmStatusBundle?.status === VMStatus.VMI_WAITING ? (
      <VMIsStarting LoadingComponent={LoadingComponent} />
    ) : (
      <VMIsDown />
    );
  }

  const vncServiceManual = (vnc && vnc.manual) || undefined;
  const rdpServiceManual = (rdp && rdp.manual) || undefined;

  const desktopViewverSelector = isWindows(vm) ? (
    <DesktopViewerSelector
      vncServiceManual={vncServiceManual}
      rdpServiceManual={rdpServiceManual}
      vm={vm}
      vmi={vmi}
      guestAgent={isGuestAgentConnected(vmi)}
    />
  ) : null;

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
  const { vm: vmProp, vmi, pods, vmStatusBundle } = props;
  const vm = asVM(vmProp);
  const services = getLoadedData(props.services);

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
      vmStatusBundle={vmStatusBundle}
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
  vmis: vmisProp,
  vmImports,
  pods,
  migrations,
  dataVolumes,
  customData: { kindObj },
}) => {
  const vm = kindObj === VirtualMachineModel && isVM(objProp) ? objProp : vmProp;
  const vmi = kindObj === VirtualMachineInstanceModel && isVMI(objProp) ? objProp : vmisProp[0];

  const namespace = getNamespace(vm);

  const resources = [
    // We probably can not simply match on labels but on Service's spec.selector.[kubevirt/vm] to achieve robust pairing VM-Service.
    // So read all services and filter on frontend.
    getResource(ServiceModel, { namespace, prop: 'services' }),
  ];

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    dataVolumes,
    vmImports,
  });

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VmConsolesWrapper vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} pods={pods} />
      </Firehose>
    </div>
  );
};

type VmConsolesWrapperProps = {
  vm?: VMKind;
  vmi?: VMIKind;
  services?: FirehoseResult;
  pods?: PodKind[];
  vmStatusBundle: VMStatusBundle;
};

type VMConsolesProps = {
  vm: VMKind;
  LoadingComponent: React.ComponentType;
  vmi?: VMIKind;
  vnc?: VNCConnectionDetailsType;
  serial?: SerialConsoleConnectionDetailsType;
  rdp?: RDPConnectionDetailsType;
  vmStatusBundle: VMStatusBundle;
};

type VMIsStartingProps = {
  LoadingComponent: React.ComponentType;
};
