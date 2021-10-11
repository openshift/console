import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { NodeLink, ResourceLink, ResourceSummary } from '@console/internal/components/utils';
import { Selector } from '@console/internal/components/utils/selector';
import { PodModel } from '@console/internal/models';
import { K8sKind, PodKind } from '@console/internal/module/k8s';
import { ServiceKind } from '@console/knative-plugin/src/types';
import { LABEL_USED_TEMPLATE_NAME, LABEL_USED_TEMPLATE_NAMESPACE } from '../../constants';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import useSSHCommand from '../../hooks/use-ssh-command';
import useSSHService from '../../hooks/use-ssh-service';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { getLabel, getName, getNamespace, getNodeName } from '../../selectors';
import { findVMIPod } from '../../selectors/pod/selectors';
import { getDescription } from '../../selectors/selectors';
import { isBootOrderChanged, isFlavorChanged } from '../../selectors/vm-like/next-run-changes';
import { getFlavorData } from '../../selectors/vm/flavor-data';
import {
  getOperatingSystem,
  getOperatingSystemName,
  isVMIReady,
  isVMRunningOrExpectedRunning,
} from '../../selectors/vm/selectors';
import { getVMLikeModel } from '../../selectors/vm/vmlike';
import { getVMINodeName, isVMIPaused } from '../../selectors/vmi';
import { getVmiIpAddresses } from '../../selectors/vmi/ip-address';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMIKind, VMKind } from '../../types';
import { getBasicID, prefixedID } from '../../utils';
import { getGuestAgentFieldNotAvailMsg } from '../../utils/guest-agent-strings';
import { isGuestAgentInstalled } from '../../utils/guest-agent-utils';
import { BootOrderSummary } from '../boot-order';
import { descriptionModal, vmFlavorModal } from '../modals';
import { BootOrderModal } from '../modals/boot-order-modal/boot-order-modal';
import affinityModal from '../modals/scheduling-modals/affinity-modal/connected-affinity-modal';
import { getRowsDataFromAffinity } from '../modals/scheduling-modals/affinity-modal/helpers';
import dedicatedResourcesModal from '../modals/scheduling-modals/dedicated-resources-modal/connected-dedicated-resources-modal';
import evictionStrategyModal from '../modals/scheduling-modals/eviction-strategy-modal/eviction-strategy-modal';
import nodeSelectorModal from '../modals/scheduling-modals/node-selector-modal/connected-node-selector-modal';
import tolerationsModal from '../modals/scheduling-modals/tolerations-modal/connected-tolerations-modal';
import { vmStatusModal } from '../modals/vm-status-modal/vm-status-modal';
import SSHModal from '../ssh-service/SSHModal';
import { VMStatus } from '../vm-status/vm-status';
import VMDetailsItem from './VMDetailsItem';
import VMDetailsItemTemplate from './VMDetailsItemTemplate';
import VMEditWithPencil from './VMEditWithPencil';
import VMIP from './VMIP';

import './ssh-details.scss';

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({
  vm,
  vmi,
  canUpdateVM,
  kindObj,
}) => {
  const { t } = useTranslation();

  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;

  const templateName = getLabel(vm, LABEL_USED_TEMPLATE_NAME);
  const templateNamespace = getLabel(vm, LABEL_USED_TEMPLATE_NAMESPACE);

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
        <VMEditWithPencil
          isEdit={canUpdateVM}
          onEditClick={() => descriptionModal({ resource: vmiLike, kind: getVMLikeModel(vmiLike) })}
        >
          {description}
        </VMEditWithPencil>
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Operating System')}
        idValue={prefixedID(id, 'os')}
        isNotAvail={!(operatingSystem || os)}
      >
        {operatingSystem || os}
      </VMDetailsItem>

      {isVM && <VMDetailsItemTemplate name={templateName} namespace={templateNamespace} />}
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
  const ipAddrs = getVmiIpAddresses(vmi);
  const workloadProfile = vmiLikeWrapper?.getWorkloadProfile();

  const { sshServices } = useSSHService(vm);
  const { command, user } = useSSHCommand(vm);
  const vmiReady = isVMIReady(vmi);
  const sshServicesRunning = sshServices?.running;

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
        dataTest="boot-order-details-item"
        editButtonId={prefixedID(id, 'boot-order-edit')}
        onEditClick={() => BootOrderModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' })}
        idValue={prefixedID(id, 'boot-order')}
        arePendingChanges={
          isVM &&
          isVMRunningOrExpectedRunning(vm, vmi) &&
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
        {launcherPod && ipAddrs && <VMIP data={ipAddrs} />}
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

      <VMDetailsItem
        title={t('kubevirt-plugin~User credentials')}
        idValue={prefixedID(id, 'authorized-ssh-key')}
      >
        {vmiReady ? (
          <>
            <span data-test="details-item-user-credentials-user-name">
              {t('kubevirt-plugin~user: {{user}}', { user })}
            </span>
            <ClipboardCopy
              isReadOnly
              data-test="SSHDetailsPage-command"
              className="SSHDetailsPage-clipboard-command"
            >
              {sshServicesRunning ? command : `ssh ${user}@`}
            </ClipboardCopy>
            {!sshServicesRunning && (
              <span className="kubevirt-menu-actions__secondary-title">
                {t('kubevirt-plugin~Requires SSH Service')}
              </span>
            )}
          </>
        ) : (
          <div className="text-secondary">{t('kubevirt-plugin~Virtual machine not running')}</div>
        )}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~SSH Access')}
        dataTest="ssh-access-details-item"
        idValue={prefixedID(id, 'ssh-access')}
        canEdit={vmiReady}
        onEditClick={() => SSHModal({ vm })}
      >
        <span data-test="details-item-ssh-access-port">
          {vmiReady ? (
            sshServicesRunning ? (
              t('kubevirt-plugin~port: {{port}}', { port: sshServices?.port })
            ) : (
              t('kubevirt-plugin~SSH Service disabled')
            )
          ) : (
            <div className="text-secondary">{t('kubevirt-plugin~Virtual machine not running')}</div>
          )}
        </span>
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
    !isVMRunningOrExpectedRunning(vm, vmi);

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
            title={t('kubevirt-plugin~Node Selector')}
            idValue={prefixedID(id, 'node-selector')}
            editButtonId={prefixedID(id, 'node-selector-edit')}
          >
            <VMEditWithPencil
              isEdit={canEdit}
              onEditClick={() => nodeSelectorModal({ vmLikeEntity: vm, blocking: true })}
            >
              <div className="kv-vm-resource--details-item">
                <Selector kind="Node" selector={nodeSelector} />
              </div>
            </VMEditWithPencil>
          </VMDetailsItem>

          <VMDetailsItem
            title={t('kubevirt-plugin~Tolerations')}
            idValue={prefixedID(id, 'tolerations')}
            editButtonId={prefixedID(id, 'tolerations-edit')}
          >
            <VMEditWithPencil
              isEdit={canEdit}
              onEditClick={() =>
                tolerationsModal({
                  vmLikeEntity: vm,
                  blocking: true,
                  modalClassName: 'modal-lg',
                })
              }
            >
              {t('kubevirt-plugin~{{count}} Toleration rule', {
                count: tolerationsWrapperCount,
              })}
            </VMEditWithPencil>
          </VMDetailsItem>

          <VMDetailsItem
            title={t('kubevirt-plugin~Affinity Rules')}
            idValue={prefixedID(id, 'affinity')}
            editButtonId={prefixedID(id, 'affinity-edit')}
          >
            <VMEditWithPencil
              isEdit={canEdit}
              onEditClick={() =>
                affinityModal({ vmLikeEntity: vm, blocking: true, modalClassName: 'modal-lg' })
              }
            >
              {t('kubevirt-plugin~{{count}} Affinity rule', {
                count: affinityWrapperCount,
              })}
            </VMEditWithPencil>
          </VMDetailsItem>
        </dl>
      </div>

      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <VMDetailsItem
            title={t('kubevirt-plugin~Flavor')}
            idValue={prefixedID(id, 'flavor')}
            editButtonId={prefixedID(id, 'flavor-edit')}
            onEditClick={() => vmFlavorModal({ vmLike: vm, blocking: true })}
            isNotAvail={!flavorText}
            arePendingChanges={
              isVM &&
              isVMRunningOrExpectedRunning(vm, vmi) &&
              isFlavorChanged(new VMWrapper(vm), new VMIWrapper(vmi))
            }
          >
            <VMEditWithPencil
              isEdit={canEditWhileVMRunning}
              onEditClick={() => vmFlavorModal({ vmLike: vm, blocking: true })}
            >
              {flavorText}
            </VMEditWithPencil>
          </VMDetailsItem>

          <VMDetailsItem
            title={t('kubevirt-plugin~Dedicated Resources')}
            idValue={prefixedID(id, 'dedicated-resources')}
            editButtonId={prefixedID(id, 'dedicated-resources-edit')}
          >
            <VMEditWithPencil
              isEdit={canEdit}
              onEditClick={() => dedicatedResourcesModal({ vmLikeEntity: vm, blocking: true })}
            >
              {isCPUPinned
                ? t(
                    'kubevirt-plugin~Workload scheduled with dedicated resources (guaranteed policy)',
                  )
                : t('kubevirt-plugin~No Dedicated resources applied')}
            </VMEditWithPencil>
          </VMDetailsItem>

          <VMDetailsItem
            title={t('kubevirt-plugin~Eviction Strategy')}
            idValue={prefixedID(id, 'eviction-strategy')}
            editButtonId={prefixedID(id, 'eviction-strategy-edit')}
          >
            <VMEditWithPencil
              isEdit={canEdit}
              onEditClick={() =>
                evictionStrategyModal({ vmLikeEntity: vm, evictionStrategy, blocking: true })
              }
            >
              {evictionStrategy || t('kubevirt-plugin~No Eviction Strategy')}
            </VMEditWithPencil>
          </VMDetailsItem>
        </dl>
      </div>
    </>
  );
};

type VMResourceSummaryProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  canUpdateVM: boolean;
};

type VMResourceListProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  pods?: PodKind[];
  vmi?: VMIKind;
  canUpdateVM: boolean;
  vmStatusBundle: VMStatusBundle;
  vmSSHService?: ServiceKind;
};

type VMSchedulingListProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  canUpdateVM: boolean;
};
