import * as React from 'react';
import {
  getOperatingSystemName,
  getOperatingSystem,
  getVmiIpAddresses,
  getWorkloadProfile,
  getVmTemplate,
  getNodeName,
  VmStatuses,
  BootOrder,
  isVmOff,
  getBootableDevicesInOrder,
} from 'kubevirt-web-ui-components';
import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace, DASH } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { VMKind, VMIKind } from '../../types';
import { VMTemplateLink } from '../vm-templates/vm-template-link';
import { getBasicID, prefixedID } from '../../utils';
import { vmDescriptionModal, vmFlavorModal } from '../modals';
import { getDescription } from '../../selectors/selectors';
import { getVMStatus } from '../../statuses/vm/vm';
import { FlavorText } from '../flavor-text';

import './_vm-resource.scss';

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({ vm, canUpdateVM }) => {
  const template = getVmTemplate(vm);

  const id = getBasicID(vm);
  const description = getDescription(vm) || DASH;

  return (
    <ResourceSummary resource={vm}>
      <dt>
        Description
        {canUpdateVM && (
          <button
            type="button"
            className="btn btn-link co-modal-btn-link co-modal-btn-link--left"
            onClick={() => vmDescriptionModal({ vmLikeEntity: vm })}
          />
        )}
      </dt>
      <dd id={prefixedID(id, 'description')} className="kubevirt-vm-resource-summary__description">
        {description}
      </dd>
      <dt>Operating System</dt>
      <dd id={prefixedID(id, 'os')}>
        {getOperatingSystemName(vm) || getOperatingSystem(vm) || DASH}
      </dd>
      <dt>Template</dt>
      <dd id={prefixedID(id, 'template')}>
        {template ? <VMTemplateLink template={template} /> : DASH}
      </dd>
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
  const vmIsOff = isVmOff(vmStatus);
  const ipAddresses = vmIsOff ? [] : getVmiIpAddresses(vmi);

  return (
    <dl className="co-m-pane__details">
      <dt>Status</dt>
      <dd id={prefixedID(id, 'vm-statuses')}>
        <VmStatuses vm={vm} pods={pods} migrations={migrations} />
      </dd>
      <dt>Pod</dt>
      <dd id={prefixedID(id, 'pod')}>
        {launcherPod ? (
          <ResourceLink
            kind={PodModel.kind}
            name={getName(launcherPod)}
            namespace={getNamespace(launcherPod)}
          />
        ) : (
          DASH
        )}
      </dd>
      <dt>Boot Order</dt>
      <dd id={prefixedID(id, 'boot-order')}>
        {sortedBootableDevices.length > 0 ? (
          <BootOrder bootableDevices={sortedBootableDevices} />
        ) : (
          DASH
        )}
      </dd>
      <dt>IP Address</dt>
      <dd id={prefixedID(id, 'ip-addresses')}>
        {ipAddresses.length > 0 ? ipAddresses.join(', ') : DASH}
      </dd>
      <dt>Node</dt>
      <dd id={prefixedID(id, 'node')}>{<NodeLink name={nodeName} />}</dd>
      <dt>
        Flavor
        {canUpdateVM && (
          <button
            type="button"
            className="btn btn-link co-modal-btn-link co-modal-btn-link--left"
            onClick={() => vmFlavorModal({ vmLike: vm })}
          />
        )}
      </dt>
      <dd id={prefixedID(id, 'flavor')}>
        <FlavorText vmLike={vm} />
      </dd>
      <dt>Workload Profile</dt>
      <dd id={prefixedID(id, 'workload-profile')}>{getWorkloadProfile(vm) || DASH}</dd>
    </dl>
  );
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
