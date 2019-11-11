import * as React from 'react';
import { BootOrder, getBootableDevicesInOrder } from 'kubevirt-web-ui-components';
import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getNodeName } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { VMKind, VMIKind } from '../../types';
import { VMTemplateLink } from '../vm-templates/vm-template-link';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal, vmFlavorModal } from '../modals';
import { VMCDRomModal } from '../modals/cdrom-vm-modal';
import { getDescription } from '../../selectors/selectors';
import { getCDRoms } from '../../selectors/vm/selectors';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';
import { getVMStatus } from '../../statuses/vm/vm';
import { getFlavorText } from '../flavor-text';
import { EditButton } from '../edit-button';
import { getVmiIpAddressesString } from '../ip-addresses';
import { VMStatuses } from '../vm-status';
import { DiskSummary } from '../vm-disks/disk-summary';
import { getOperatingSystemName, getOperatingSystem, getWorkloadProfile } from '../../selectors/vm';

import './vm-resource.scss';

export const VMDetailsItem: React.FC<VMDetailsItemProps> = ({
  title,
  canEdit = false,
  editButtonId,
  onEditClick,
  idValue,
  isNotAvail = false,
  valueClassName,
  children,
}) => {
  return (
    <>
      <dt>
        {title} <EditButton id={editButtonId} canEdit={canEdit} onClick={onEditClick} />
      </dt>
      <dd id={idValue} className={valueClassName}>
        {isNotAvail ? <span className="text-secondary">Not available</span> : children}
      </dd>
    </>
  );
};

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({ vm, canUpdateVM }) => {
  const templateNamespacedName = getVMTemplateNamespacedName(vm);

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

      <VMDetailsItem
        title="Template"
        idValue={prefixedID(id, 'template')}
        isNotAvail={!templateNamespacedName}
      >
        {templateNamespacedName && <VMTemplateLink {...templateNamespacedName} />}
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
  const vmStatus = getVMStatus({ vm, vmi, pods, migrations });
  const { launcherPod } = vmStatus;
  const cds = getCDRoms(vm);
  const sortedBootableDevices = getBootableDevicesInOrder(vm);
  const nodeName = getNodeName(launcherPod);
  const ipAddrs = getVmiIpAddressesString(vmi, vmStatus);
  const workloadProfile = getWorkloadProfile(vm);
  const flavorText = getFlavorText(vm);

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem title="Status" idValue={prefixedID(id, 'vm-statuses')}>
        <VMStatuses vm={vm} vmi={vmi} pods={pods} migrations={migrations} />
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
        title="CD-ROMs"
        canEdit={canUpdateVM}
        editButtonId={prefixedID(id, 'cdrom-edit')}
        onEditClick={() => VMCDRomModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' })}
        idValue={prefixedID(id, 'cdrom')}
        isNotAvail={cds.length === 0}
      >
        <DiskSummary disks={cds} vm={vm} />
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
        <EditButton
          id={prefixedID(id, 'flavor-edit')}
          canEdit={canUpdateVM}
          onClick={() => vmFlavorModal({ vmLike: vm })}
        >
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
  canEdit?: boolean;
  editButtonId?: string;
  onEditClick?: () => void;
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
