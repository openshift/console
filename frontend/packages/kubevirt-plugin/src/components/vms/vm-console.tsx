import * as React from 'react';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';

import {
  VmConsoles,
  isWindows,
  getResource,
  findVmPod,
  getVmStatus,
} from 'kubevirt-web-ui-components';
import { getName, getNamespace } from '@console/shared';
import { WSFactory } from '@console/internal/module/ws-factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodModel, ServiceModel } from '@console/internal/models';

import { VIRT_LAUNCHER_POD_PREFIX } from '../../constants/vm';
import { menuActionStart } from './menu-actions';
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
} from '../../selectors/vmi';
import { VMIKind, VMKind } from '../../types/vm';
import { getLoadedData } from '../../utils';
import { VMTabProps } from './types';

const VmConsolesWrapper: React.FC<VmConsolesWrapperProps> = (props) => {
  const { vm } = props;
  const vmi = getLoadedData(props.vmi);
  const pods = getLoadedData(props.pods);
  const services = getLoadedData(props.services);
  const migrations = getLoadedData(props.migrations);

  const onStartVm = () => {
    const vmStatus = getVmStatus(vm, pods, migrations);
    menuActionStart(VirtualMachineModel, vm, { vmStatus }).callback();
  };

  let rdp;
  if (isWindows(vm)) {
    const rdpService = findRDPService(vmi, services);
    const launcherPod = findVmPod(pods, vm, VIRT_LAUNCHER_POD_PREFIX);
    rdp = getRdpConnectionDetails(vmi, rdpService, launcherPod);
  }

  return (
    <VmConsoles
      vm={vm}
      vmi={vmi}
      onStartVm={onStartVm}
      vnc={getVncConnectionDetails(vmi)}
      serial={getSerialConsoleConnectionDetails(vmi)}
      rdp={rdp}
      LoadingComponent={LoadingInline}
      WSFactory={WSFactory}
    />
  );
};

interface VmConsolesWrapperProps {
  vm?: VMKind;
  vmi?: FirehoseResult<VMIKind>;
  services?: FirehoseResult<K8sResourceKind[]>;
  pods?: FirehoseResult<K8sResourceKind[]>;
  migrations?: FirehoseResult<K8sResourceKind[]>;
}

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
