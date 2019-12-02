import * as React from 'react';
import { AccessConsoles, VncConsole } from '@patternfly/react-console';
import { Button } from '@patternfly/react-core';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodModel, ServiceModel } from '@console/internal/models';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
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
import { findVMPod } from '../../selectors/pod/selectors';
import { getVMStatus } from '../../statuses/vm/vm';
import { getLoadedData, getResource } from '../../utils';
import { isVMStarting, isWindows } from '../../selectors/vm';
import { VMIKind, VMKind } from '../../types/vm';
import { menuActionStart } from './menu-actions';
import { SerialConsoleConnector } from './serial-console-connector';
import { DesktopViewerSelector } from './desktop-viewer-selector';
import { VMTabProps } from './types';

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
  const { vm } = props;
  const vmi = getLoadedData(props.vmi);
  const pods = getLoadedData(props.pods);
  const services = getLoadedData(props.services);
  const migrations = getLoadedData(props.migrations);

  const onStartVm = () => {
    const vmStatus = getVMStatus({ vm, vmi, pods, migrations });
    menuActionStart(VirtualMachineModel, vm, { vmStatus }).callback();
  };

  let rdp;
  if (isWindows(vm)) {
    const rdpService = findRDPService(vmi, services);
    const launcherPod = findVMPod(vm, pods);
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

export const VMConsoleFirehose: React.FC<VMTabProps> = ({ obj: vm }) => {
  const name = getName(vm);
  const namespace = getNamespace(vm);

  const vmiRes = getResource(VirtualMachineInstanceModel, {
    name,
    namespace,
    isList: false,
    prop: 'vmi',
    optional: true,
  });

  const resources = [
    vmiRes,
    // We probably can not simply match on labels but on Service's spec.selector.[kubevirt/vm] to achieve robust pairing VM-Service.
    // So read all services and filter on frontend.
    getResource(ServiceModel, { namespace, prop: 'services' }),
    getResource(PodModel, {
      namespace,
      matchExpressions: [{ key: 'kubevirt.io', operator: 'Exists' }],
      prop: 'pods',
    }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
  ];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VmConsolesWrapper vm={vm} />
      </Firehose>
    </div>
  );
};

type VmConsolesWrapperProps = {
  vm?: VMKind;
  vmi?: FirehoseResult<VMIKind>;
  services?: FirehoseResult<K8sResourceKind[]>;
  pods?: FirehoseResult<K8sResourceKind[]>;
  migrations?: FirehoseResult<K8sResourceKind[]>;
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
