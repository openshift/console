import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { VMKind } from '../../../types';
import { V1HostDevice } from '../../../types/api';
import { hostDevicePath } from './consts';
import { HardwareDevicesModal } from './HardwareDevicesModal';

export type HostDevicesModalProps = {
  vm: VMKind;
  isVMRunning: boolean;
  vmDevices: V1HostDevice[];
  vmiDevices: V1HostDevice[];
} & ModalComponentProps &
  HandlePromiseProps;

export const HostDevicesModal: React.FC<HostDevicesModalProps> = ({
  vm,
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
    <div className="pf-c-empty-state">{t('kubevirt-plugin~No Host devices found')}</div>
  );

  return (
    <HardwareDevicesModal
      vm={vm}
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
