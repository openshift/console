import React from 'react';

import {
  getVncConnectionDetails,
  getSerialConsoleConnectionDetails,
  getRdpConnectionDetails,
  findRDPService,
} from './utils/resources';

import { VmConsoles, isWindows, getResource, findVmPod, VIRT_LAUNCHER_POD_PREFIX } from 'kubevirt-web-ui-components';
import { LoadingInline } from './okdcomponents';
import { WSFactory } from '../module/okdk8s';
import { startStopVmModal } from './modals/start-stop-vm-modal';
import { WithResources } from './utils/withResources';

import {
  VirtualMachineInstanceModel,
  VirtualMachineModel,
  ServiceModel, PodModel,
} from '../models';

const VmConsoles_ = ({ vm, vmi, services, pods }) => {
  const onStartVm = () => startStopVmModal({
    kind: VirtualMachineModel,
    resource: vm,
    start: true,
  });

  let rdp;
  if (isWindows(vm)) {
    const rdpService = findRDPService(vmi, services);
    const launcherPod = findVmPod(pods, vm, VIRT_LAUNCHER_POD_PREFIX);
    rdp = getRdpConnectionDetails(vmi, rdpService, launcherPod);
  }

  return <VmConsoles vm={vm}
    vmi={vmi}
    onStartVm={onStartVm}
    vnc={getVncConnectionDetails(vmi)}
    serial={getSerialConsoleConnectionDetails(vmi)}
    rdp={rdp}
    LoadingComponent={LoadingInline}
    WSFactory={WSFactory} />;
};

/**
 * Wrapper for VmConsoles performing asynchronous loading of API resources.
 */
const ConnectedVmConsoles = ({ obj: vm }) => {
  const { name, namespace } = vm.metadata;
  const resourceMap = {
    vmi: {
      resource: getResource(VirtualMachineInstanceModel, {name, namespace, isList: false}),
      ignoreErrors: true,
    },
    services: {
      // We probably can not simply match on labels but on Service's spec.selector.[kubevirt/vm] to achieve robust pairing VM-Service.
      // So read all services and filter on frontend.
      resource: getResource(ServiceModel, {namespace}),
    },
    pods: {
      resource: getResource(PodModel, { namespace, matchExpressions: [{key: 'kubevirt.io', operator: 'Exists' }] }),
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <VmConsoles_ vm={vm} />
    </WithResources>
  );
};

export default ConnectedVmConsoles;
