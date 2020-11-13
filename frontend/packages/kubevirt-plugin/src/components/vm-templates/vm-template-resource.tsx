import * as React from 'react';
import { ResourceSummary, LabelList } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { getBasicID, prefixedID } from '../../utils';
import { descriptionModal } from '../modals/description-modal';
import { BootOrderModal } from '../modals/boot-order-modal';
import dedicatedResourcesModal from '../modals/scheduling-modals/dedicated-resources-modal/connected-dedicated-resources-modal';
import tolerationsModal from '../modals/scheduling-modals/tolerations-modal/connected-tolerations-modal';
import nodeSelectorModal from '../modals/scheduling-modals/node-selector-modal/connected-node-selector-modal';
import affinityModal from '../modals/scheduling-modals/affinity-modal/connected-affinity-modal';
import { getRowsDataFromAffinity } from '../modals/scheduling-modals/affinity-modal/helpers';
import { getDescription } from '../../selectors/selectors';
import {
  getFlavor,
  getWorkloadProfile,
  isDedicatedCPUPlacement,
} from '../../selectors/vm/selectors';
import { getTemplateOperatingSystems } from '../../selectors/vm-template/advanced';
import { vmFlavorModal } from '../modals';
import { EditButton } from '../edit-button';
import { VMDetailsItem } from '../vms/vm-resource';
import { asVM, getDevices, getVMLikeModel } from '../../selectors/vm';
import { BootOrderSummary } from '../boot-order';
import { VMTemplateLink } from './vm-template-link';
import { TemplateSource } from './vm-template-source';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { getVMTemplateNamespacedName } from '../../selectors/vm-template/selectors';
import {
  NODE_SELECTOR_MODAL_TITLE,
  DEDICATED_RESOURCES_PINNED,
  DEDICATED_RESOURCES_NOT_PINNED,
  DEDICATED_RESOURCES_MODAL_TITLE,
  TOLERATIONS_MODAL_TITLE,
  AFFINITY_MODAL_TITLE,
} from '../modals/scheduling-modals/shared/consts';
import './_vm-template-resource.scss';
import { getFlavorText } from '../../selectors/vm/flavor-text';
import { TemplateSourceStatus } from '../../statuses/template/types';

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
          onClick={() => descriptionModal({ resource: template, kind: getVMLikeModel(template) })}
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
  sourceStatus,
  loaded,
}) => {
  const id = getBasicID(template);
  const devices = getDevices(template);

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        title="Boot Order"
        canEdit
        editButtonId={prefixedID(id, 'boot-order-edit')}
        onEditClick={() => BootOrderModal({ vmLikeEntity: template, modalClassName: 'modal-lg' })}
        idValue={prefixedID(id, 'boot-order')}
      >
        <BootOrderSummary devices={devices} />
      </VMDetailsItem>

      <VMDetailsItem title="Provision Source" idValue={prefixedID(id, 'provisioning-source')}>
        <TemplateSource loaded={loaded} template={template} sourceStatus={sourceStatus} detailed />
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
    flavor: getFlavor(template),
    cpu: vmWrapper.getCPU(),
    memory: vmWrapper.getMemory(),
  });
  const isCPUPinned = isDedicatedCPUPlacement(vm);
  const nodeSelector = vmWrapper?.getNodeSelector();
  const tolerations = vmWrapper?.getTolerations() || [];
  const tolerationsLabels = tolerations.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});
  const affinityWrapperCount = getRowsDataFromAffinity(vmWrapper?.getAffinity())?.length;

  return (
    <>
      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <VMDetailsItem
            canEdit={canUpdateTemplate}
            title={NODE_SELECTOR_MODAL_TITLE}
            idValue={prefixedID(id, 'node-selector')}
            editButtonId={prefixedID(id, 'node-selector-edit')}
            onEditClick={() => nodeSelectorModal({ vmLikeEntity: template, blocking: true })}
          >
            <LabelList kind="Node" labels={nodeSelector} />
          </VMDetailsItem>

          <VMDetailsItem
            canEdit={canUpdateTemplate}
            title={TOLERATIONS_MODAL_TITLE}
            idValue={prefixedID(id, 'tolerations')}
            editButtonId={prefixedID(id, 'tolerations-edit')}
            onEditClick={() =>
              tolerationsModal({
                vmLikeEntity: template,
                blocking: true,
                modalClassName: 'modal-lg',
              })
            }
          >
            <LabelList kind="Node" labels={tolerationsLabels} />
          </VMDetailsItem>

          <VMDetailsItem
            canEdit={canUpdateTemplate}
            title={AFFINITY_MODAL_TITLE}
            idValue={prefixedID(id, 'affinity')}
            editButtonId={prefixedID(id, 'affinity-edit')}
            onEditClick={() =>
              affinityModal({
                vmLikeEntity: template,
                blocking: true,
                modalClassName: 'modal-lg',
              })
            }
          >
            {affinityWrapperCount} {'Affinity rules'}
          </VMDetailsItem>
        </dl>
      </div>
      <div className="col-sm-6">
        <dl className="co-m-pane__details">
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
      </div>
    </>
  );
};

type VMTemplateResourceListProps = {
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
  canUpdateTemplate?: boolean;
  loaded: boolean;
};

type VMTemplateResourceSummaryProps = {
  template: TemplateKind;
  canUpdateTemplate: boolean;
};
