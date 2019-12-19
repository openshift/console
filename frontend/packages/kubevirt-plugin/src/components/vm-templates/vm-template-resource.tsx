import * as React from 'react';
import { ResourceSummary } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { K8sEntityMap } from '@console/shared/src';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal } from '../modals/vm-description-modal';
import { BootOrderModal } from '../modals/boot-order-modal';
import { VMCDRomModal } from '../modals/cdrom-vm-modal';
import { getDescription } from '../../selectors/selectors';
import {
  getCDRoms,
  getOperatingSystemName,
  getOperatingSystem,
  getWorkloadProfile,
} from '../../selectors/vm/selectors';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';
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

import './_vm-template-resource.scss';

export const VMTemplateResourceSummary: React.FC<VMTemplateResourceSummaryProps> = ({
  template,
  canUpdateTemplate,
}) => {
  const id = getBasicID(template);
  const templateNamespacedName = getVMTemplateNamespacedName(template);

  const description = getDescription(template);
  const os = getOperatingSystemName(asVM(template)) || getOperatingSystem(asVM(template));
  const workloadProfile = getWorkloadProfile(template);

  return (
    <ResourceSummary resource={template}>
      <VMDetailsItem
        title="Description"
        idValue={prefixedID(id, 'description')}
        valueClassName="kubevirt-vm-resource-summary__description"
        isNotAvail={!description}
      >
        <EditButton
          canEdit={canUpdateTemplate}
          onClick={() => vmDescriptionModal({ vmLikeEntity: template })}
        >
          {description}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem title="Operating System" idValue={prefixedID(id, 'os')} isNotAvail={!os}>
        {os}
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

  const id = getBasicID(template);
  const devices = getDevices(template);
  const cds = getCDRoms(asVM(template));
  const flavorText = getFlavorText(template);

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
          onClick={() => vmFlavorModal({ vmLike: template })}
        >
          {flavorText}
        </EditButton>
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
