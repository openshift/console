import * as React from 'react';
import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { K8sKind, PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getNodeName } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { VMKind, VMIKind } from '../../types';
import { VMTemplateLink } from '../vm-templates/vm-template-link';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal, vmFlavorModal } from '../modals';
import { VMCDRomModal } from '../modals/cdrom-vm-modal/vm-cdrom-modal';
import { DedicatedResourcesModal } from '../modals/dedicated-resources-modal/dedicated-resources-modal';
import { BootOrderModal } from '../modals/boot-order-modal/boot-order-modal';
import VMStatusModal from '../modals/vm-status-modal/vm-status-modal';
import { getDescription } from '../../selectors/selectors';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';
import { getFlavorText } from '../flavor-text';
import { EditButton } from '../edit-button';
import { VMStatuses } from '../vm-status';
import { DiskSummary } from '../vm-disks/disk-summary';
import { BootOrderSummary } from '../boot-order';
import {
  RESOURCE_PINNED,
  RESOURCE_NOT_PINNED,
  DEDICATED_RESOURCES,
} from '../modals/dedicated-resources-modal/consts';
import { getOperatingSystemName, getOperatingSystem } from '../../selectors/vm';
import { getVmiIpAddresses } from '../../selectors/vmi/ip-address';
import { findVMPod } from '../../selectors/pod/selectors';
import { isVMIPaused } from '../../selectors/vmi';

import './vm-resource.scss';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';

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

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({
  vm,
  vmi,
  canUpdateVM,
  kindObj,
}) => {
  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;

  const templateNamespacedName = getVMTemplateNamespacedName(vm);
  const id = getBasicID(vmiLike);
  const description = getDescription(vmiLike);
  const os = getOperatingSystemName(vmiLike) || getOperatingSystem(vmiLike);

  return (
    <ResourceSummary resource={vmiLike}>
      <VMDetailsItem
        title="Description"
        idValue={prefixedID(id, 'description')}
        valueClassName="kubevirt-vm-resource-summary__description"
      >
        {!description && <span className="text-secondary">Not available</span>}
        <EditButton
          canEdit={canUpdateVM}
          onClick={() => vmDescriptionModal({ vmLikeEntity: vmiLike })}
        >
          {description}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem title="Operating System" idValue={prefixedID(id, 'os')} isNotAvail={!os}>
        {os}
      </VMDetailsItem>

      {isVM && (
        <VMDetailsItem
          title="Template"
          idValue={prefixedID(id, 'template')}
          isNotAvail={!templateNamespacedName}
        >
          {templateNamespacedName && <VMTemplateLink {...templateNamespacedName} />}
        </VMDetailsItem>
      )}
    </ResourceSummary>
  );
};

export const VMDetailsList: React.FC<VMResourceListProps> = ({
  vm,
  vmi,
  pods,
  migrations,
  canUpdateVM,
  kindObj,
}) => {
  const [isBootOrderModalOpen, setBootOrderModalOpen] = React.useState<boolean>(false);
  const [isDedicatedResourcesModalOpen, setDedicatedResourcesModalOpen] = React.useState<boolean>(
    false,
  );
  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;
  const vmiLikeWrapper = asVMILikeWrapper(vmiLike);

  const canEdit = vmiLike && canUpdateVM && kindObj !== VirtualMachineInstanceModel;

  const [isStatusModalOpen, setStatusModalOpen] = React.useState<boolean>(false);

  const launcherPod = findVMPod(vmiLike, pods);
  const id = getBasicID(vmiLike);
  const cds = vmiLikeWrapper?.getCDROMs() || [];
  const devices = vmiLikeWrapper?.getLabeledDevices() || [];
  const nodeName = getNodeName(launcherPod);
  const ipAddrs = getVmiIpAddresses(vmi).join(', ');
  const workloadProfile = vmiLikeWrapper?.getWorkloadProfile();
  const flavorText = getFlavorText({
    memory: vmiLikeWrapper?.getMemory(),
    cpu: vmiLikeWrapper?.getCPU(),
    flavor: vmiLikeWrapper?.getFlavor(),
  });
  const isCPUPinned = vmiLikeWrapper?.isDedicatedCPUPlacement();

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        title="Status"
        canEdit={isVMIPaused(vmi)}
        editButtonId={prefixedID(id, 'status-edit')}
        onEditClick={() => setStatusModalOpen(true)}
        idValue={prefixedID(id, 'vm-statuses')}
      >
        <VMStatusModal isOpen={isStatusModalOpen} setOpen={setStatusModalOpen} vmi={vmi} />
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
        canEdit={canEdit}
        editButtonId={prefixedID(id, 'boot-order-edit')}
        onEditClick={() => setBootOrderModalOpen(true)}
        idValue={prefixedID(id, 'boot-order')}
      >
        <BootOrderModal
          isOpen={isBootOrderModalOpen}
          setOpen={setBootOrderModalOpen}
          vmLikeEntity={vm}
        />
        <BootOrderSummary devices={devices} />
      </VMDetailsItem>

      <VMDetailsItem
        title="CD-ROMs"
        canEdit={canEdit}
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
        {canEdit ? (
          <EditButton
            id={prefixedID(id, 'flavor-edit')}
            canEdit={canEdit}
            onClick={() => vmFlavorModal({ vmLike: vm })}
          >
            {flavorText}
          </EditButton>
        ) : (
          <>{flavorText}</>
        )}
      </VMDetailsItem>

      <VMDetailsItem
        title={DEDICATED_RESOURCES}
        idValue={prefixedID(id, 'dedicated-resources')}
        canEdit={canEdit}
        onEditClick={() => setDedicatedResourcesModalOpen(true)}
        editButtonId={prefixedID(id, 'dedicated-resources-edit')}
      >
        <DedicatedResourcesModal
          vmLikeEntity={vm}
          isOpen={isDedicatedResourcesModalOpen}
          setOpen={setDedicatedResourcesModalOpen}
        />
        {isCPUPinned ? RESOURCE_PINNED : RESOURCE_NOT_PINNED}
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
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  canUpdateVM: boolean;
};

type VMResourceListProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  pods?: PodKind[];
  migrations?: any[];
  vmi?: VMIKind;
  canUpdateVM: boolean;
};
