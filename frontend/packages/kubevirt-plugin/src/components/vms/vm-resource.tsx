import * as React from 'react';
import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { K8sKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getNodeName } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { Selector } from '@console/internal/components/utils/selector';
import { VMKind, VMIKind } from '../../types';
import { VMTemplateLink } from '../vm-templates/vm-template-link';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal, vmFlavorModal } from '../modals';
import { VMCDRomModal } from '../modals/cdrom-vm-modal/vm-cdrom-modal';
import { BootOrderModal } from '../modals/boot-order-modal/boot-order-modal';
import dedicatedResourcesModal from '../modals/scheduling-modals/dedicated-resources-modal/connected-dedicated-resources-modal';
import nodeSelectorModal from '../modals/scheduling-modals/node-selector-modal/connected-node-selector-modal';
import tolerationsModal from '../modals/scheduling-modals/tolerations-modal/connected-tolerations-modal';
import affinityModal from '../modals/scheduling-modals/affinity-modal/connected-affinity-modal';
import { getRowsDataFromAffinity } from '../modals/scheduling-modals/affinity-modal/helpers';
import VMStatusModal from '../modals/vm-status-modal/vm-status-modal';
import { getDescription } from '../../selectors/selectors';
import { EditButton } from '../edit-button';
import { VMStatus } from '../vm-status/vm-status';
import { DiskSummary } from '../vm-disks/disk-summary';
import { BootOrderSummary } from '../boot-order';
import { getOperatingSystemName, getOperatingSystem } from '../../selectors/vm';
import { getVmiIpAddresses } from '../../selectors/vmi/ip-address';
import { findVMIPod } from '../../selectors/pod/selectors';
import { isVMIPaused, getVMINodeName } from '../../selectors/vmi';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { getVMTemplate } from '../../selectors/vm-template/selectors';
import { getFlavorText } from '../../selectors/vm/flavor-text';
import {
  NODE_SELECTOR_MODAL_TITLE,
  DEDICATED_RESOURCES_PINNED,
  DEDICATED_RESOURCES_NOT_PINNED,
  DEDICATED_RESOURCES_MODAL_TITLE,
  TOLERATIONS_MODAL_TITLE,
  AFFINITY_MODAL_TITLE,
} from '../modals/scheduling-modals/shared/consts';
import { VMStatusBundle } from '../../statuses/vm/types';

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

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({
  vm,
  vmi,
  canUpdateVM,
  templates,
  kindObj,
}) => {
  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;

  const template = getVMTemplate(vm, templates);
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
        <VMDetailsItem title="Template" idValue={prefixedID(id, 'template')} isNotAvail={!template}>
          {template && (
            <VMTemplateLink name={getName(template)} namespace={getNamespace(template)} />
          )}
        </VMDetailsItem>
      )}
    </ResourceSummary>
  );
};

export const VMDetailsList: React.FC<VMResourceListProps> = ({
  vm,
  vmi,
  pods,
  vmStatusBundle,
  canUpdateVM,
  kindObj,
}) => {
  const [isBootOrderModalOpen, setBootOrderModalOpen] = React.useState<boolean>(false);
  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;
  const vmiLikeWrapper = asVMILikeWrapper(vmiLike);

  const canEdit = vmiLike && canUpdateVM && kindObj !== VirtualMachineInstanceModel;

  const [isStatusModalOpen, setStatusModalOpen] = React.useState<boolean>(false);

  const launcherPod = findVMIPod(vmi, pods);
  const id = getBasicID(vmiLike);
  const cds = vmiLikeWrapper?.getCDROMs() || [];
  const devices = vmiLikeWrapper?.getLabeledDevices() || [];
  const nodeName = getVMINodeName(vmi) || getNodeName(launcherPod);
  const ipAddrs = getVmiIpAddresses(vmi).join(', ');
  const workloadProfile = vmiLikeWrapper?.getWorkloadProfile();

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
        <VMStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
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
        isNotAvail={!launcherPod || !ipAddrs}
      >
        {launcherPod && ipAddrs}
      </VMDetailsItem>

      <VMDetailsItem
        title="Node"
        idValue={prefixedID(id, 'node')}
        isNotAvail={!launcherPod || !nodeName}
      >
        {launcherPod && nodeName && <NodeLink name={nodeName} />}
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

export const VMSchedulingList: React.FC<VMSchedulingListProps> = ({
  vm,
  vmi,
  canUpdateVM,
  kindObj,
}) => {
  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;
  const vmiLikeWrapper = asVMILikeWrapper(vmiLike);
  const canEdit = vmiLike && canUpdateVM && kindObj !== VirtualMachineInstanceModel;

  const id = getBasicID(vmiLike);
  const flavorText = getFlavorText({
    memory: vmiLikeWrapper?.getMemory(),
    cpu: vmiLikeWrapper?.getCPU(),
    flavor: vmiLikeWrapper?.getFlavor(),
  });
  const isCPUPinned = vmiLikeWrapper?.isDedicatedCPUPlacement();
  const nodeSelector = vmiLikeWrapper?.getNodeSelector();
  const tolerationsWrapperCount = (vmiLikeWrapper?.getTolerations() || []).length;
  const affinityWrapperCount = getRowsDataFromAffinity(vmiLikeWrapper?.getAffinity())?.length;

  return (
    <>
      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <VMDetailsItem
            canEdit={canEdit}
            title={NODE_SELECTOR_MODAL_TITLE}
            idValue={prefixedID(id, 'node-selector')}
            editButtonId={prefixedID(id, 'node-selector-edit')}
            onEditClick={() => nodeSelectorModal({ vmLikeEntity: vm, blocking: true })}
          >
            <Selector kind="Node" selector={nodeSelector} />
          </VMDetailsItem>

          <VMDetailsItem
            canEdit={canEdit}
            title={TOLERATIONS_MODAL_TITLE}
            idValue={prefixedID(id, 'tolerations')}
            editButtonId={prefixedID(id, 'tolerations-edit')}
            onEditClick={() =>
              tolerationsModal({
                vmLikeEntity: vm,
                blocking: true,
                modalClassName: 'modal-lg',
              })
            }
          >
            {tolerationsWrapperCount > 0 ? (
              `${tolerationsWrapperCount} Tolerations rules`
            ) : (
              <p className="text-muted">No tolerations</p>
            )}
          </VMDetailsItem>

          <VMDetailsItem
            canEdit={canEdit}
            title={AFFINITY_MODAL_TITLE}
            idValue={prefixedID(id, 'affinity')}
            editButtonId={prefixedID(id, 'affinity-edit')}
            onEditClick={() =>
              affinityModal({ vmLikeEntity: vm, blocking: true, modalClassName: 'modal-lg' })
            }
          >
            {affinityWrapperCount > 0 ? (
              `${affinityWrapperCount} Affinity rules`
            ) : (
              <p className="text-muted">No Affinity rules</p>
            )}
          </VMDetailsItem>
        </dl>
      </div>

      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <VMDetailsItem
            title="Flavor"
            idValue={prefixedID(id, 'flavor')}
            canEdit={canEdit}
            onEditClick={() => vmFlavorModal({ vmLike: vm, blocking: true })}
            editButtonId={prefixedID(id, 'flavor-edit')}
            isNotAvail={!flavorText}
          >
            {flavorText}
          </VMDetailsItem>

          <VMDetailsItem
            title={DEDICATED_RESOURCES_MODAL_TITLE}
            idValue={prefixedID(id, 'dedicated-resources')}
            canEdit={canEdit}
            onEditClick={() => dedicatedResourcesModal({ vmLikeEntity: vm, blocking: true })}
            editButtonId={prefixedID(id, 'dedicated-resources-edit')}
          >
            {isCPUPinned ? DEDICATED_RESOURCES_PINNED : DEDICATED_RESOURCES_NOT_PINNED}
          </VMDetailsItem>
        </dl>
      </div>
    </>
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
  templates: TemplateKind[];
  canUpdateVM: boolean;
};

type VMResourceListProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  pods?: PodKind[];
  vmi?: VMIKind;
  canUpdateVM: boolean;
  vmStatusBundle: VMStatusBundle;
};

type VMSchedulingListProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  canUpdateVM: boolean;
};
