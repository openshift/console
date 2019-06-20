import * as React from 'react';

import {
  getDescription,
  getOperatingSystemName,
  getOperatingSystem,
  getVmStatus,
  getVmiIpAddresses,
  getWorkloadProfile,
  getVmTemplate,
  getTemplateDisplayName,
  getNodeName,
  getFlavor,
  VmStatuses,
  BootOrder,
  isVmOff,
  getBootableDevicesInOrder,
} from 'kubevirt-web-ui-components';

import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { getName, getNamespace, DASH } from '@console/shared';
import { PodModel } from '@console/internal/models';
import {
  V1VirtualMachine,
  V1VirtualMachineInstance,
  V1VirtualMachineInstanceMigration,
} from 'kubevirt-typescript-api/esm';
import { V1Pod } from 'openshift-typescript-api/esm';

export const VMResourceSummary = ({ vm }: VMResourceSummaryProps) => {
  const template = getVmTemplate(vm);
  const templateLink = template && getTemplateDisplayName(template); // TODO(mlibra): link to a template detail, once implemented

  return (
    <ResourceSummary resource={vm}>
      <dt>Description</dt>
      <dd>{getDescription(vm)}</dd>
      <dt>Operating System</dt>
      <dd>{getOperatingSystemName(vm) || getOperatingSystem(vm) || DASH}</dd>
      <dt>Template</dt>
      <dd>{templateLink || DASH}</dd>
    </ResourceSummary>
  );
};

export const VMDetailsList = ({ vm, vmi, pods, migrations }: VMResourceListProps) => {
  const vmStatus = getVmStatus(vm, pods, migrations);
  const { launcherPod } = vmStatus;
  const sortedBootableDevices = getBootableDevicesInOrder(vm);
  const nodeName = getNodeName(launcherPod);
  const vmIsOff = isVmOff(vmStatus);
  const ipAddresses = vmIsOff ? [] : getVmiIpAddresses(vmi);

  return (
    <dl className="co-m-pane__details">
      <dt>Status</dt>
      <dd>
        <VmStatuses vm={vm} pods={pods} migrations={migrations} />
      </dd>
      <dt>Pod</dt>
      <dd>
        {launcherPod ? (
          <ResourceLink
            kind={PodModel.kind}
            name={getName(launcherPod)}
            namespace={getNamespace(launcherPod)}
          />
        ) : (
          DASH
        )}
      </dd>
      <dt>Boot Order</dt>
      <dd>
        {sortedBootableDevices.length > 0 ? (
          <BootOrder bootableDevices={sortedBootableDevices} />
        ) : (
          DASH
        )}
      </dd>
      <dt>IP Address</dt>
      <dd>{ipAddresses.length > 0 ? ipAddresses.join(', ') : DASH}</dd>
      <dt>Node</dt>
      <dd>{<NodeLink name={nodeName} />}</dd>
      <dt>Flavour</dt>
      <dd>{getFlavor(vm) || DASH}</dd>
      <dt>Workload Profile</dt>
      <dd>{getWorkloadProfile(vm) || DASH}</dd>
    </dl>
  );
};

type VMResourceSummaryProps = {
  vm: V1VirtualMachine;
};

type VMResourceListProps = {
  vm: V1VirtualMachine;
  pods?: V1Pod[];
  migrations?: V1VirtualMachineInstanceMigration[];
  vmi?: V1VirtualMachineInstance;
};
