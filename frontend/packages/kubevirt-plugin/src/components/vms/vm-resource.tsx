import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceSummary, NodeLink, ResourceLink } from '@console/internal/components/utils';
import { K8sKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getNodeName } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { Selector } from '@console/internal/components/utils/selector';
import { VMKind, VMIKind } from '../../types';
import { VMTemplateLink } from '../vm-templates/vm-template-link';
import { getBasicID, prefixedID } from '../../utils';
import { descriptionModal, vmFlavorModal } from '../modals';
import { BootOrderModal } from '../modals/boot-order-modal/boot-order-modal';
import dedicatedResourcesModal from '../modals/scheduling-modals/dedicated-resources-modal/connected-dedicated-resources-modal';
import nodeSelectorModal from '../modals/scheduling-modals/node-selector-modal/connected-node-selector-modal';
import evictionStrategyModal from '../modals/scheduling-modals/eviction-strategy-modal/eviction-strategy-modal';
import tolerationsModal from '../modals/scheduling-modals/tolerations-modal/connected-tolerations-modal';
import affinityModal from '../modals/scheduling-modals/affinity-modal/connected-affinity-modal';
import { getRowsDataFromAffinity } from '../modals/scheduling-modals/affinity-modal/helpers';
import { vmStatusModal } from '../modals/vm-status-modal/vm-status-modal';
import { getDescription } from '../../selectors/selectors';
import { EditButton } from '../edit-button';
import { VMStatus } from '../vm-status/vm-status';
import { BootOrderSummary } from '../boot-order';
import { getOperatingSystemName, getOperatingSystem, getVMLikeModel } from '../../selectors/vm';
import { getVmiIpAddresses } from '../../selectors/vmi/ip-address';
import { findVMIPod } from '../../selectors/pod/selectors';
import { isVMIPaused, getVMINodeName } from '../../selectors/vmi';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { getVMTemplate } from '../../selectors/vm-template/selectors';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMStatusBundle } from '../../statuses/vm/types';
import { isGuestAgentInstalled } from '../dashboards-page/vm-dashboard/vm-alerts';
import { getGuestAgentFieldNotAvailMsg } from '../../utils/guest-agent-strings';
import { Button } from '@patternfly/react-core';
import { isFlavorChanged, isBootOrderChanged } from '../../selectors/vm-like/next-run-changes';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { getFlavorData } from '../../selectors/vm/flavor-data';

export const VMDetailsItem: React.FC<VMDetailsItemProps> = ({
  title,
  canEdit = false,
  editButtonId,
  onEditClick,
  idValue,
  isNotAvail = false,
  isNotAvailMessage,
  valueClassName,
  arePendingChanges,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <dt>
        <span>
          {title} <EditButton id={editButtonId} canEdit={canEdit} onClick={onEditClick} />
          {arePendingChanges && (
            <Button
              className="co-modal-btn-link--inline"
              variant="link"
              isInline
              onClick={onEditClick}
            >
              {t('kubevirt-plugin~View Pending Changes')}
            </Button>
          )}
        </span>
      </dt>
      <dd id={idValue} className={valueClassName}>
        {isNotAvail ? (
          <span className="text-secondary">
            {isNotAvailMessage || t('kubevirt-plugin~Not available')}
          </span>
        ) : (
          children
        )}
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
  const { t } = useTranslation();

  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;

  const template = getVMTemplate(vm, templates);
  const id = getBasicID(vmiLike);
  const description = getDescription(vmiLike);
  const os = getOperatingSystemName(vmiLike) || getOperatingSystem(vmiLike);

  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const operatingSystem = guestAgentInfo.getOSInfo().getPrettyName();

  return (
    <ResourceSummary resource={vmiLike}>
      <VMDetailsItem
        title={t('kubevirt-plugin~Description')}
        idValue={prefixedID(id, 'description')}
        valueClassName="kubevirt-vm-resource-summary__description"
      >
        {!description && (
          <span className="text-secondary">{t('kubevirt-plugin~Not available')}</span>
        )}
        <EditButton
          canEdit={canUpdateVM}
          onClick={() => descriptionModal({ resource: vmiLike, kind: getVMLikeModel(vmiLike) })}
        >
          {description}
        </EditButton>
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Operating System')}
        idValue={prefixedID(id, 'os')}
        isNotAvail={!(operatingSystem || os)}
      >
        {operatingSystem || os}
      </VMDetailsItem>

      {isVM && (
        <VMDetailsItem
          title={t('kubevirt-plugin~Template')}
          idValue={prefixedID(id, 'template')}
          isNotAvail={!template}
        >
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
  const { t } = useTranslation();
  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const hostname = guestAgentInfo.getHostname();
  const timeZone = guestAgentInfo.getTimezoneName();

  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;
  const vmiLikeWrapper = asVMILikeWrapper(vmiLike);
  const { status } = vmStatusBundle;
  const guestAgentFieldNotAvailMsg = getGuestAgentFieldNotAvailMsg(
    t,
    isGuestAgentInstalled(vmi),
    status,
  );

  const canEditWhileVMRunning = vmiLike && canUpdateVM && kindObj !== VirtualMachineInstanceModel;

  const launcherPod = findVMIPod(vmi, pods);
  const id = getBasicID(vmiLike);
  const devices = vmiLikeWrapper?.getLabeledDevices() || [];
  const nodeName = getVMINodeName(vmi) || getNodeName(launcherPod);
  const ipAddrs = getVmiIpAddresses(vmi).join(', ');
  const workloadProfile = vmiLikeWrapper?.getWorkloadProfile();

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        title={t('kubevirt-plugin~Status')}
        canEdit={isVMIPaused(vmi)}
        editButtonId={prefixedID(id, 'status-edit')}
        onEditClick={() => vmStatusModal({ vmi })}
        idValue={prefixedID(id, 'vm-statuses')}
      >
        <VMStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Pod')}
        idValue={prefixedID(id, 'pod')}
        isNotAvail={!launcherPod}
      >
        {launcherPod && (
          <ResourceLink
            kind={PodModel.kind}
            name={getName(launcherPod)}
            namespace={getNamespace(launcherPod)}
          />
        )}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Boot Order')}
        canEdit={canEditWhileVMRunning}
        editButtonId={prefixedID(id, 'boot-order-edit')}
        onEditClick={() => BootOrderModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' })}
        idValue={prefixedID(id, 'boot-order')}
        arePendingChanges={
          isVM &&
          isVMRunningOrExpectedRunning(vm) &&
          isBootOrderChanged(new VMWrapper(vm), new VMIWrapper(vmi))
        }
      >
        <BootOrderSummary devices={devices} />
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~IP Address')}
        idValue={prefixedID(id, 'ip-addresses')}
        isNotAvail={!launcherPod || !ipAddrs}
      >
        {launcherPod && ipAddrs}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Hostname')}
        idValue={prefixedID(id, 'hostname')}
        isNotAvail={!hostname}
        isNotAvailMessage={guestAgentFieldNotAvailMsg}
      >
        {hostname}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Time Zone')}
        idValue={prefixedID(id, 'timezone')}
        isNotAvail={!timeZone}
        isNotAvailMessage={guestAgentFieldNotAvailMsg}
      >
        {timeZone}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Node')}
        idValue={prefixedID(id, 'node')}
        isNotAvail={!launcherPod || !nodeName}
      >
        {launcherPod && nodeName && <NodeLink name={nodeName} />}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Workload Profile')}
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
  const { t } = useTranslation();
  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;
  const vmiLikeWrapper = asVMILikeWrapper(vmiLike);
  const canEditWhileVMRunning = vmiLike && canUpdateVM && kindObj !== VirtualMachineInstanceModel;
  const canEdit =
    vmiLike &&
    canUpdateVM &&
    kindObj !== VirtualMachineInstanceModel &&
    !isVMRunningOrExpectedRunning(vm);

  const id = getBasicID(vmiLike);
  const flavorText = t(
    'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
    getFlavorData({
      memory: vmiLikeWrapper?.getMemory(),
      cpu: vmiLikeWrapper?.getCPU(),
      flavor: vmiLikeWrapper?.getFlavor(),
    }),
  );
  const isCPUPinned = vmiLikeWrapper?.isDedicatedCPUPlacement();
  const nodeSelector = vmiLikeWrapper?.getNodeSelector();
  const evictionStrategy = vmiLikeWrapper?.getEvictionStrategy();
  const tolerationsWrapperCount = (vmiLikeWrapper?.getTolerations() || []).length;
  const affinityWrapperCount = getRowsDataFromAffinity(vmiLikeWrapper?.getAffinity())?.length;

  return (
    <>
      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <VMDetailsItem
            canEdit={canEdit}
            title={t('kubevirt-plugin~Node Selector')}
            idValue={prefixedID(id, 'node-selector')}
            editButtonId={prefixedID(id, 'node-selector-edit')}
            onEditClick={() => nodeSelectorModal({ vmLikeEntity: vm, blocking: true })}
          >
            <Selector kind="Node" selector={nodeSelector} />
          </VMDetailsItem>

          <VMDetailsItem
            canEdit={canEdit}
            title={t('kubevirt-plugin~Tolerations')}
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
              `${tolerationsWrapperCount} Toleration rules`
            ) : (
              <p className="text-muted">{t('kubevirt-plugin~No Toleration rules')}</p>
            )}
          </VMDetailsItem>

          <VMDetailsItem
            canEdit={canEdit}
            title={t('kubevirt-plugin~Affinity Rules')}
            idValue={prefixedID(id, 'affinity')}
            editButtonId={prefixedID(id, 'affinity-edit')}
            onEditClick={() =>
              affinityModal({ vmLikeEntity: vm, blocking: true, modalClassName: 'modal-lg' })
            }
          >
            {affinityWrapperCount > 0 ? (
              `${affinityWrapperCount} Affinity rules`
            ) : (
              <p className="text-muted">{t('kubevirt-plugin~No Affinity rules')}</p>
            )}
          </VMDetailsItem>
        </dl>
      </div>

      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <VMDetailsItem
            title={t('kubevirt-plugin~Flavor')}
            idValue={prefixedID(id, 'flavor')}
            canEdit={canEditWhileVMRunning}
            onEditClick={() => vmFlavorModal({ vmLike: vm, blocking: true })}
            editButtonId={prefixedID(id, 'flavor-edit')}
            isNotAvail={!flavorText}
            arePendingChanges={
              isVM &&
              isVMRunningOrExpectedRunning(vm) &&
              isFlavorChanged(new VMWrapper(vm), new VMIWrapper(vmi))
            }
          >
            {flavorText}
          </VMDetailsItem>

          <VMDetailsItem
            title={t('kubevirt-plugin~Dedicated Resources')}
            idValue={prefixedID(id, 'dedicated-resources')}
            canEdit={canEdit}
            onEditClick={() => dedicatedResourcesModal({ vmLikeEntity: vm, blocking: true })}
            editButtonId={prefixedID(id, 'dedicated-resources-edit')}
          >
            {isCPUPinned
              ? t('kubevirt-plugin~Workload scheduled with dedicated resources (guaranteed policy)')
              : t('kubevirt-plugin~No Dedicated resources applied')}
          </VMDetailsItem>

          <VMDetailsItem
            title={t('kubevirt-plugin~Eviction Strategy')}
            idValue={prefixedID(id, 'eviction-strategy')}
            canEdit={canEdit}
            onEditClick={() =>
              evictionStrategyModal({ vmLikeEntity: vm, evictionStrategy, blocking: true })
            }
            editButtonId={prefixedID(id, 'eviction-strategy-edit')}
          >
            {evictionStrategy || (
              <p className="text-muted">{t('kubevirt-plugin~No Eviction Strategy')}</p>
            )}
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
  isNotAvailMessage?: string;
  valueClassName?: string;
  arePendingChanges?: boolean;
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
