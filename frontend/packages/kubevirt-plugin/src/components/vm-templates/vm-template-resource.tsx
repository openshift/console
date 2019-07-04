import * as React from 'react';

import {
  getDescription,
  getOperatingSystemName,
  getOperatingSystem,
  getWorkloadProfile,
  getVmTemplate,
  getFlavor,
  BootOrder,
  getBootableDevicesInOrder,
  TemplateSource,
} from 'kubevirt-web-ui-components';

import { ResourceSummary } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { TemplateKind, K8sResourceKind } from '@console/internal/module/k8s';
import { VMTemplateLink } from './vm-template-link';

export const VMTemplateResourceSummary: React.FC<VMTemplateResourceSummaryProps> = ({
  template,
}) => {
  const base = getVmTemplate(template);

  return (
    <ResourceSummary resource={template}>
      <dt>Description</dt>
      <dd>{getDescription(template)}</dd>
      <dt>Operating System</dt>
      <dd>{getOperatingSystemName(template) || getOperatingSystem(template) || DASH}</dd>
      <dt>Workload Profile</dt>
      <dd>{getWorkloadProfile(template) || DASH}</dd>
      <dt>Base Template</dt>
      <dd>{base ? <VMTemplateLink template={base} /> : DASH}</dd>
    </ResourceSummary>
  );
};

export const VMTemplateDetailsList: React.FC<VMTemplateResourceListProps> = ({
  template,
  dataVolumes,
}) => {
  const sortedBootableDevices = getBootableDevicesInOrder(template);

  return (
    <dl className="co-m-pane__details">
      <dt>Boot Order</dt>
      <dd>
        {sortedBootableDevices.length > 0 ? (
          <BootOrder bootableDevices={sortedBootableDevices} />
        ) : (
          DASH
        )}
      </dd>
      <dt>Flavor</dt>
      <dd>{getFlavor(template) || DASH}</dd>
      <dt>Source</dt>
      <dd>
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
};

type VMTemplateResourceSummaryProps = {
  template: TemplateKind;
};
