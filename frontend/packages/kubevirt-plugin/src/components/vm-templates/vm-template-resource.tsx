import * as React from 'react';
import {
  getOperatingSystemName,
  getOperatingSystem,
  getWorkloadProfile,
  getVmTemplate,
  BootOrder,
  getBootableDevicesInOrder,
  TemplateSource,
} from 'kubevirt-web-ui-components';
import { ResourceSummary } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { TemplateKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal } from '../modals/vm-description-modal';
import { getDescription } from '../../selectors/selectors';
import { vmFlavorModal } from '../modals';
import { FlavorText } from '../flavor-text';
import { EditButton } from '../edit-button';
import { VMTemplateLink } from './vm-template-link';

import './_vm-template-resource.scss';

export const VMTemplateResourceSummary: React.FC<VMTemplateResourceSummaryProps> = ({
  template,
  canUpdateTemplate,
}) => {
  const id = getBasicID(template);
  const base = getVmTemplate(template);

  const description = getDescription(template) || DASH;

  return (
    <ResourceSummary resource={template}>
      <dt>Description</dt>
      <dd id={prefixedID(id, 'description')} className="kubevirt-vm-resource-summary__description">
        <EditButton
          canEdit={canUpdateTemplate}
          onClick={() => vmDescriptionModal({ vmLikeEntity: template })}
        >
          {description}
        </EditButton>
      </dd>
      <dt>Operating System</dt>
      <dd id={prefixedID(id, 'os')}>
        {getOperatingSystemName(template) || getOperatingSystem(template) || DASH}
      </dd>
      <dt>Workload Profile</dt>
      <dd id={prefixedID(id, 'workload-profile')}>{getWorkloadProfile(template) || DASH}</dd>
      <dt>Base Template</dt>
      <dd id={prefixedID(id, 'base-template')}>
        {base ? <VMTemplateLink template={base} /> : DASH}
      </dd>
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

  return (
    <dl className="co-m-pane__details">
      <dt>Boot Order</dt>
      <dd id={prefixedID(id, 'boot-order')}>
        {sortedBootableDevices.length > 0 ? (
          <BootOrder bootableDevices={sortedBootableDevices} />
        ) : (
          DASH
        )}
      </dd>
      <dt>Flavor</dt>
      <dd id={prefixedID(id, 'flavor')}>
        <EditButton canEdit={canUpdateTemplate} onClick={() => vmFlavorModal({ vmLike: template })}>
          <FlavorText vmLike={template} />
        </EditButton>
      </dd>
      <dt>Provision Source</dt>
      <dd id={prefixedID(id, 'provisioning-source')}>
        {dataVolumes ? (
          <TemplateSource template={template} dataVolumes={dataVolumes} detailed />
        ) : (
          DASH
        )}
      </dd>
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
