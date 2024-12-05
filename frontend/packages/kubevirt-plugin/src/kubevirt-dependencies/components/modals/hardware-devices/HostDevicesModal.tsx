import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { V1HostDevice } from '../../../types/api';
import { VMKind } from '../../../types/vm';
import { hostDevicePath } from './consts';
import { HardwareDevicesModal } from './HardwareDevicesModal';

export type HostDevicesModalProps = {
  vmLikeEntity: VMKind | TemplateKind;
  vmDevices: V1HostDevice[];
  vmiDevices?: V1HostDevice[];
  isVMRunning?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;

export const HostDevicesModal: React.FC<HostDevicesModalProps> = ({
  vmLikeEntity,
  isVMRunning,
  vmDevices,
  vmiDevices,
  close,
  handlePromise,
  inProgress,
  errorMessage,
}) => {
  const { t } = useTranslation();

  const emptyState = (
    <div className="pf-v5-c-empty-state">{t('kubevirt-plugin~No Host devices found')}</div>
  );

  return (
    <HardwareDevicesModal
      vmLikeEntity={vmLikeEntity}
      patchPath={hostDevicePath}
      isVMRunning={isVMRunning}
      vmDevices={vmDevices}
      vmiDevices={vmiDevices}
      title={t('kubevirt-plugin~Host devices')}
      emptyState={emptyState}
      addDeviceText={t('kubevirt-plugin~Add Host device')}
      close={close}
      handlePromise={handlePromise}
      inProgress={inProgress}
      errorMessage={errorMessage}
    />
  );
};

export const hostDevicesModal = createModalLauncher(withHandlePromise(HostDevicesModal));
