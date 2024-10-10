import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GenericStatus } from '@console/dynamic-plugin-sdk';
import { NodeLink, ResourceLink, useAccessReview2 } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { useGuestAgentInfo } from '../../hooks/useGuestAgentInfo';
import useSSHCommand from '../../hooks/useSSHCommand';
import { useSSHService2 } from '../../hooks/useSSHService';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import {
  HyperConvergedModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { getName, getNamespace } from '../../selectors/k8sCommon';
import { findVMIPod } from '../../selectors/pod';
import { getNodeName } from '../../selectors/selectors';
import { isBootOrderChanged } from '../../selectors/vm-like/next-run-changes';
import { isVMIReady, isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { isVMIPaused } from '../../selectors/vmi';
import { getVMINodeName } from '../../selectors/vmi/basic';
import { getVmiIpAddresses } from '../../selectors/vmi/ip-address';
import { getGuestAgentFieldNotAvailMsg } from '../../utils/guest-agent-strings';
import { isGuestAgentInstalled } from '../../utils/guest-agent-utils';
import { getBasicID, prefixedID } from '../../utils/utils';
import { BootOrderSummary } from '../boot-order/summary/boot-order-summary';
import { BootOrderModal } from '../modals/boot-order-modal/boot-order-modal';
import { gpuDevicesModal } from '../modals/hardware-devices/GPUDeviceModal';
import { hostDevicesModal } from '../modals/hardware-devices/HostDevicesModal';
import { permissionsErrorModal } from '../modals/permissions-error-modal/permissions-error-modal';
import { vmStatusModal } from '../modals/vm-status-modal';
import { TARGET_PORT } from '../ssh-service/SSHForm/ssh-form-utils';
import SSHModal from '../ssh-service/SSHModal';
import { getVMStatusIcon } from '../vm-status/vm-status';
import { VMResourceListProps } from './types/types';
import VMDetailsItem from './VMDetailsItem';
import VMEditWithPencil from './VMEditWithPencil';
import VMIP from './VMIP';

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

  const vmWrapper = new VMWrapper(vm);
  const vmiWrapper = new VMIWrapper(vmi);

  const launcherPod = findVMIPod(vmi, pods);
  const id = getBasicID(vmiLike);
  const devices = vmiLikeWrapper?.getLabeledDevices() || [];
  const nodeName = getVMINodeName(vmi) || getNodeName(launcherPod);
  const ipAddrs = getVmiIpAddresses(vmi);
  const workloadProfile = vmiLikeWrapper?.getWorkloadProfile();

  const [sshService] = useSSHService2(vmi);

  const { command, user } = useSSHCommand(vmi);
  const vmiReady = isVMIReady(vmi);
  const sshServicesRunning = !!sshService;
  const sshServicePort = sshService?.spec?.ports?.find(
    (port) => parseInt(port.targetPort, 10) === TARGET_PORT,
  )?.nodePort;

  const [canWatchHC] = useAccessReview2({
    group: HyperConvergedModel?.apiGroup,
    resource: HyperConvergedModel?.plural,
    verb: 'watch',
  });

  return (
    <dl className="co-m-pane__details">
      <VMDetailsItem
        title={t('kubevirt-plugin~Status')}
        canEdit={isVMIPaused(vmi)}
        editButtonId={prefixedID(id, 'status-edit')}
        onEditClick={() => vmStatusModal({ vmi })}
        idValue={prefixedID(id, 'vm-statuses')}
      >
        <GenericStatus title={vm?.status?.printableStatus} Icon={getVMStatusIcon(status, false)} />
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
        title={t('kubevirt-plugin~Boot order')}
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
        title={t('kubevirt-plugin~IP address')}
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
        title={t('kubevirt-plugin~Time zone')}
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
        title={t('kubevirt-plugin~Workload profile')}
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
                {t('kubevirt-plugin~Requires SSH service')}
              </span>
            )}
          </>
        ) : (
          <div className="text-secondary">{t('kubevirt-plugin~Virtual machine not running')}</div>
        )}
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~SSH access')}
        dataTest="ssh-access-details-item"
        idValue={prefixedID(id, 'ssh-access')}
        canEdit={vmiReady}
        onEditClick={() => SSHModal({ vm })}
      >
        <span data-test="details-item-ssh-access-port">
          {vmiReady ? (
            sshServicesRunning ? (
              t('kubevirt-plugin~port: {{port}}', { port: sshServicePort })
            ) : (
              t('kubevirt-plugin~SSH service disabled')
            )
          ) : (
            <div className="text-secondary">{t('kubevirt-plugin~Virtual machine not running')}</div>
          )}
        </span>
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Hardware devices')}
        idValue={prefixedID(id, 'hardware-devices')}
        editButtonId={prefixedID(id, 'hardware-devices-edit')}
      >
        <VMEditWithPencil
          isEdit={isVM}
          onEditClick={
            canWatchHC
              ? () =>
                  gpuDevicesModal({
                    vmLikeEntity: vmWrapper.asResource(),
                    vmDevices: vmWrapper.getGPUDevices(),
                    vmiDevices: vmiWrapper.getGPUDevices(),
                    isVMRunning: isVMRunningOrExpectedRunning(vm, vmi),
                  })
              : () =>
                  permissionsErrorModal({
                    title: t('kubevirt-plugin~Attach GPU device to VM'),
                    errorMsg: t(
                      'kubevirt-plugin~You do not have permissions to attach GPU devices. Contact your system administrator for more information.',
                    ),
                  })
          }
        >
          {t('kubevirt-plugin~{{gpusCount}} GPU devices', {
            gpusCount: vmWrapper.getGPUDevices()?.length || [].length,
          })}
        </VMEditWithPencil>
        <br />
        <VMEditWithPencil
          isEdit={isVM}
          onEditClick={
            canWatchHC
              ? () =>
                  hostDevicesModal({
                    vmLikeEntity: vmWrapper.asResource(),
                    vmDevices: vmWrapper.getHostDevices(),
                    vmiDevices: vmiWrapper.getHostDevices(),
                    isVMRunning: isVMRunningOrExpectedRunning(vm, vmi),
                  })
              : () =>
                  permissionsErrorModal({
                    title: t('kubevirt-plugin~Attach Host device to VM'),
                    errorMsg: t(
                      'kubevirt-plugin~You do not have permissions to attach Host devices. Contact your system administrator for more information.',
                    ),
                  })
          }
        >
          {t('kubevirt-plugin~{{hostDevicesCount}} Host devices', {
            hostDevicesCount: vmWrapper.getHostDevices()?.length || [].length,
          })}
        </VMEditWithPencil>
      </VMDetailsItem>
    </dl>
  );
};
