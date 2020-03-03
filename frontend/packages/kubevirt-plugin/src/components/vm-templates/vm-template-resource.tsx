import * as React from 'react';
import { ResourceSummary } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { K8sEntityMap } from '@console/shared/src';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal } from '../modals/vm-description-modal';
import { BootOrderModal } from '../modals/boot-order-modal';
import { VMCDRomModal } from '../modals/cdrom-vm-modal/vm-cdrom-modal';
import { DedicatedResourcesModal } from '../modals/dedicated-resources-modal/dedicated-resources-modal';
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
import {
  RESOURCE_PINNED,
  RESOURCE_NOT_PINNED,
  DEDICATED_RESOURCES,
} from '../modals/dedicated-resources-modal/consts';
import { VMTemplateLink } from './vm-template-link';
import { TemplateSource } from './vm-template-source';

import './_vm-template-resource.scss';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';

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
  const [isDedicatedResourcesModalOpen, setDedicatedResourcesModalOpen] = React.useState<boolean>(
    false,
  );

  const id = getBasicID(template);
  const devices = getDevices(template);
  const cds = getCDRoms(asVM(template));
  const vm = asVM(template);
  const vmWrapper = VMWrapper.initialize(vm);
  const flavorText = getFlavorText({
    flavor: getFlavor(vm),
    cpu: vmWrapper.getCPU(),
    memory: vmWrapper.getMemory(),
  });
  const isCPUPinned = isDedicatedCPUPlacement(vm);

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

      <VMDetailsItem title="Flavor" idValue={prefixedID(id, 'flavor')} isNotAvail={!flavorText}>
        <EditButton
          id={prefixedID(id, 'flavor-edit')}
          canEdit={canUpdateTemplate}
          onClick={() => vmFlavorModal({ vmLike: template, blocking: true })}
        >
          {flavorText}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem
        title={DEDICATED_RESOURCES}
        idValue={prefixedID(id, 'dedicated-resources')}
        canEdit
        onEditClick={() => setDedicatedResourcesModalOpen(true)}
        editButtonId={prefixedID(id, 'dedicated-resources-edit')}
      >
        <DedicatedResourcesModal
          vmLikeEntity={template}
          isOpen={isDedicatedResourcesModalOpen}
          setOpen={setDedicatedResourcesModalOpen}
        />
        {isCPUPinned ? RESOURCE_PINNED : RESOURCE_NOT_PINNED}
      </VMDetailsItem>

      <VMDetailsItem title="Provision Source" idValue={prefixedID(id, 'provisioning-source')}>
        <TemplateSource template={template} dataVolumeLookup={dataVolumeLookup} detailed />
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
