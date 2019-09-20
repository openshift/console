import * as React from 'react';
import {
  getOperatingSystemName,
  getOperatingSystem,
  getWorkloadProfile,
  getVmTemplate,
  VmStatuses,
  BootOrder,
  getBootableDevicesInOrder,
} from 'kubevirt-web-ui-components';
import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getNodeName } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { VMKind, VMIKind } from '../../types';
import { VMTemplateLink } from '../vm-templates/vm-template-link';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal, vmFlavorModal } from '../modals';
import { getDescription } from '../../selectors/selectors';
import { getVMStatus } from '../../statuses/vm/vm';
import { getFlavorText } from '../flavor-text';
import { EditButton } from '../edit-button';
import { getVmiIpAddressesString } from '../ip-addresses';

import './_vm-resource.scss';

export const VMDetailsItem: React.FC<VMDetailsItemProps> = ({
  title,
  idValue,
  isNotAvail = false,
  valueClassName,
  children,
}) => {
  return (
    <>
      <dt>{title}</dt>
      <dd id={idValue} className={valueClassName}>
        {isNotAvail ? <span className="text-secondary">Not available</span> : children}
      </dd>
    </>
  );
};

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({ vm, canUpdateVM }) => {
  const template = getVmTemplate(vm);

  const id = getBasicID(vm);
  const description = getDescription(vm);
  const os = getOperatingSystemName(vm) || getOperatingSystem(vm);

  return (
    <ResourceSummary resource={vm}>
      <VMDetailsItem
        title="Description"
        idValue={prefixedID(id, 'description')}
        valueClassName="kubevirt-vm-resource-summary__description"
        isNotAvail={!description}
      >
        <EditButton canEdit={canUpdateVM} onClick={() => vmDescriptionModal({ vmLikeEntity: vm })}>
          {description}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem title="Operating System" idValue={prefixedID(id, 'os')} isNotAvail={!os}>
        {os}
      </VMDetailsItem>

      <VMDetailsItem title="Template" idValue={prefixedID(id, 'template')} isNotAvail={!template}>
        {template && <VMTemplateLink template={template} />}
      </VMDetailsItem>
    </ResourceSummary>
  );
};

export const VMDetailsList: React.FC<VMResourceListProps> = ({
  vm,
  vmi,
  pods,
  migrations,
  canUpdateVM,
}) => {
  const id = getBasicID(vm);
  const vmStatus = getVMStatus(vm, pods, migrations);
  const { launcherPod } = vmStatus;
  const sortedBootableDevices = getBootableDevicesInOrder(vm);
  const nodeName = getNodeName(launcherPod);
  const ipAddrs = getVmiIpAddressesString(vmi, vmStatus);
  const workloadProfile = getWorkloadProfile(vm);
  const flavorText = getFlavorText(vm);

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem title="Status" idValue={prefixedID(id, 'vm-statuses')}>
        <VmStatuses vm={vm} pods={pods} migrations={migrations} />
      </VMDetailsItem>

      <VMDetailsItem title="Pod" idValue={prefixedID(id, 'pod')} isNotAvail={!launcherPod}>
        {launcherPod && (
          <ResourceLink
            kind={PodModel.kind}
            name={getName(launcherPod)}
            namespace={getNamespace(launcherPod)}
          />
        )}
      </VMDetailsItem>

      <VMDetailsItem
        title="Boot Order"
        idValue={prefixedID(id, 'boot-order')}
        isNotAvail={sortedBootableDevices.length === 0}
      >
        <BootOrder bootableDevices={sortedBootableDevices} />
      </VMDetailsItem>

      <VMDetailsItem
        title="IP Address"
        idValue={prefixedID(id, 'ip-addresses')}
        isNotAvail={!ipAddrs}
      >
        {ipAddrs}
      </VMDetailsItem>

      <VMDetailsItem title="Node" idValue={prefixedID(id, 'node')} isNotAvail={!nodeName}>
        {nodeName && <NodeLink name={nodeName} />}
      </VMDetailsItem>

      <VMDetailsItem title="Flavor" idValue={prefixedID(id, 'flavor')} isNotAvail={!flavorText}>
        <EditButton canEdit={canUpdateVM} onClick={() => vmFlavorModal({ vmLike: vm })}>
          {flavorText}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem
        title="Workload Profile"
        idValue={prefixedID(id, 'workload-profile')}
        isNotAvail={!workloadProfile}
      >
        {workloadProfile}
      </VMDetailsItem>
    </dl>
  );
};

type VMDetailsItemProps = {
  title: string;
  idValue?: string;
  isNotAvail?: boolean;
  valueClassName?: string;
  children: React.ReactNode;
};

type VMResourceSummaryProps = {
  vm: VMKind;
  canUpdateVM: boolean;
};

type VMResourceListProps = {
  vm: VMKind;
  pods?: PodKind[];
  migrations?: any[];
  vmi?: VMIKind;
  canUpdateVM: boolean;
};
