import * as React from 'react';
import { ResourceSummary, LabelList } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { K8sEntityMap } from '@console/shared/src';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal } from '../modals/vm-description-modal';
import { BootOrderModal } from '../modals/boot-order-modal';
import { VMCDRomModal } from '../modals/cdrom-vm-modal/vm-cdrom-modal';
import dedicatedResourcesModal from '../modals/scheduling-modals/dedicated-resources-modal/connected-dedicated-resources-modal';
import nodeSelectorModal from '../modals/scheduling-modals/node-selector-modal';
import { getDescription } from '../../selectors/selectors';
import {
  getCDRoms,
  getFlavor,
  getWorkloadProfile,
  isDedicatedCPUPlacement,
} from '../../selectors/vm/selectors';
import { getTemplateOperatingSystems } from '../../selectors/vm-template/advanced';
import { vmFlavorModal } from '../modals';
import { getFlavorText } from '../flavor-text';
import { EditButton } from '../edit-button';
import { VMDetailsItem } from '../vms/vm-resource';
import { DiskSummary } from '../vm-disks/disk-summary';
import { asVM, getDevices } from '../../selectors/vm';
import { BootOrderSummary } from '../boot-order';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { VMTemplateLink } from './vm-template-link';
import { TemplateSource } from './vm-template-source';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';
import {
  NODE_SELECTOR_MODAL_TITLE,
  DEDICATED_RESOURCES_PINNED,
  DEDICATED_RESOURCES_NOT_PINNED,
  DEDICATED_RESOURCES_MODAL_TITLE,
} from '../modals/scheduling-modals/shared/consts';
import './_vm-template-resource.scss';

export const VMTemplateResourceSummary: React.FC<VMTemplateResourceSummaryProps> = ({
  template,
  canUpdateTemplate,
}) => {
  const id = getBasicID(template);
  const templateNamespacedName = getVMTemplateNamespacedName(template);

  const description = getDescription(template);
  const os = getTemplateOperatingSystems([template])[0];
  const workloadProfile = getWorkloadProfile(template);

  return (
    <ResourceSummary resource={template}>
      <VMDetailsItem
        title="Description"
        idValue={prefixedID(id, 'description')}
        valueClassName="kubevirt-vm-resource-summary__description"
      >
        {!description && <span className="text-secondary">Not available</span>}
        <EditButton
          canEdit={canUpdateTemplate}
          onClick={() => vmDescriptionModal({ vmLikeEntity: template })}
        >
          {description}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem title="Operating System" idValue={prefixedID(id, 'os')} isNotAvail={!os}>
        {os ? os.name || os.id : null}
      </VMDetailsItem>

      <VMDetailsItem
        title="Workload Profile"
        idValue={prefixedID(id, 'workload-profile')}
        isNotAvail={!workloadProfile}
      >
        {workloadProfile}
      </VMDetailsItem>

      <VMDetailsItem
        title="Base Template"
        idValue={prefixedID(id, 'base-template')}
        isNotAvail={!templateNamespacedName}
      >
        {templateNamespacedName && <VMTemplateLink {...templateNamespacedName} />}
      </VMDetailsItem>
    </ResourceSummary>
  );
};

export const VMTemplateDetailsList: React.FC<VMTemplateResourceListProps> = ({
  template,
  dataVolumeLookup,
  canUpdateTemplate,
}) => {
  const [isBootOrderModalOpen, setBootOrderModalOpen] = React.useState<boolean>(false);

  const vm = asVM(template);
  const id = getBasicID(template);
  const devices = getDevices(template);
  const cds = getCDRoms(vm);

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        title="Boot Order"
        canEdit
        editButtonId={prefixedID(id, 'boot-order-edit')}
        onEditClick={() => setBootOrderModalOpen(true)}
        idValue={prefixedID(id, 'boot-order')}
      >
        <BootOrderModal
          isOpen={isBootOrderModalOpen}
          setOpen={setBootOrderModalOpen}
          vmLikeEntity={template}
        />
        <BootOrderSummary devices={devices} />
      </VMDetailsItem>

      <VMDetailsItem
        title="CD-ROMs"
        canEdit={canUpdateTemplate}
        editButtonId={prefixedID(id, 'cdrom-edit')}
        onEditClick={() => VMCDRomModal({ vmLikeEntity: template, modalClassName: 'modal-lg' })}
        idValue={prefixedID(id, 'cdrom')}
        isNotAvail={cds.length === 0}
      >
        <DiskSummary disks={cds} vm={asVM(template)} />
      </VMDetailsItem>

      <VMDetailsItem title="Provision Source" idValue={prefixedID(id, 'provisioning-source')}>
        <TemplateSource template={template} dataVolumeLookup={dataVolumeLookup} detailed />
      </VMDetailsItem>
    </dl>
  );
};

export const VMTemplateSchedulingList: React.FC<VMTemplateResourceSummaryProps> = ({
  template,
  canUpdateTemplate,
}) => {
  const id = getBasicID(template);
  const vm = asVM(template);
  const vmWrapper = new VMWrapper(vm);
  const flavorText = getFlavorText({
    flavor: getFlavor(vm),
    cpu: vmWrapper.getCPU(),
    memory: vmWrapper.getMemory(),
  });
  const isCPUPinned = isDedicatedCPUPlacement(vm);
  const nodeSelector = vmWrapper?.getNodeSelector();

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        canEdit={canUpdateTemplate}
        title={NODE_SELECTOR_MODAL_TITLE}
        idValue={prefixedID(id, 'node-selector')}
        editButtonId={prefixedID(id, 'node-selectors-edit')}
        onEditClick={() => nodeSelectorModal({ vmLikeEntity: template, blocking: true })}
      >
        <LabelList kind="Node" labels={nodeSelector} />
      </VMDetailsItem>

      <VMDetailsItem
        title="Flavor"
        idValue={prefixedID(id, 'flavor')}
        canEdit={canUpdateTemplate}
        onEditClick={() => vmFlavorModal({ vmLike: template, blocking: true })}
        editButtonId={prefixedID(id, 'flavor-edit')}
        isNotAvail={!flavorText}
      >
        {flavorText}
      </VMDetailsItem>

      <VMDetailsItem
        title={DEDICATED_RESOURCES_MODAL_TITLE}
        idValue={prefixedID(id, 'dedicated-resources')}
        canEdit={canUpdateTemplate}
        onEditClick={() =>
          dedicatedResourcesModal({
            vmLikeEntity: template,
            blocking: true,
          })
        }
        editButtonId={prefixedID(id, 'dedicated-resources-edit')}
      >
        {isCPUPinned ? DEDICATED_RESOURCES_PINNED : DEDICATED_RESOURCES_NOT_PINNED}
      </VMDetailsItem>
    </dl>
  );
};

type VMTemplateResourceListProps = {
  template: TemplateKind;
  dataVolumeLookup: K8sEntityMap<V1alpha1DataVolume>;
  canUpdateTemplate: boolean;
};

type VMTemplateResourceSummaryProps = {
  template: TemplateKind;
  canUpdateTemplate: boolean;
};
