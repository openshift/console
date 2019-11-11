import * as React from 'react';
import * as _ from 'lodash';
import {
  getOperatingSystemName,
  getOperatingSystem,
  getWorkloadProfile,
  BootOrder,
  getBootableDevicesInOrder,
  TemplateSource,
  getTemplateProvisionSource,
} from 'kubevirt-web-ui-components';
import { ResourceSummary } from '@console/internal/components/utils';
import { TemplateKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal } from '../modals/vm-description-modal';
import { VMCDRomModal } from '../modals/cdrom-vm-modal';
import { getDescription } from '../../selectors/selectors';
import { getCDRoms } from '../../selectors/vm/selectors';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';
import { vmFlavorModal } from '../modals';
import { getFlavorText } from '../flavor-text';
import { EditButton } from '../edit-button';
import { VMDetailsItem } from '../vms/vm-resource';
import { DiskSummary } from '../vm-disks/disk-summary';
import { asVM } from '../../selectors/vm';
import { VMTemplateLink } from './vm-template-link';

import './_vm-template-resource.scss';

export const VMTemplateResourceSummary: React.FC<VMTemplateResourceSummaryProps> = ({
  template,
  canUpdateTemplate,
}) => {
  const id = getBasicID(template);
  const templateNamespacedName = getVMTemplateNamespacedName(template);

  const description = getDescription(template);
  const os = getOperatingSystemName(template) || getOperatingSystem(template);
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
  dataVolumes,
  canUpdateTemplate,
}) => {
  const id = getBasicID(template);
  const sortedBootableDevices = getBootableDevicesInOrder(template);
  const cds = getCDRoms(asVM(template));
  const flavorText = getFlavorText(template);
  const isProvisionSource =
    dataVolumes && !!_.get(getTemplateProvisionSource(template, dataVolumes), 'type');

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        title="Boot Order"
        idValue={prefixedID(id, 'boot-order')}
        isNotAvail={sortedBootableDevices.length === 0}
      >
        <BootOrder bootableDevices={sortedBootableDevices} />
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

      <VMDetailsItem
        title="Provision Source"
        idValue={prefixedID(id, 'provisioning-source')}
        isNotAvail={!isProvisionSource}
      >
        {dataVolumes && <TemplateSource template={template} dataVolumes={dataVolumes} detailed />}
      </VMDetailsItem>
    </dl>
  );
};

type VMTemplateResourceListProps = {
  template: TemplateKind;
  dataVolumes: K8sResourceKind[];
  canUpdateTemplate: boolean;
};

type VMTemplateResourceSummaryProps = {
  template: TemplateKind;
  canUpdateTemplate: boolean;
};
