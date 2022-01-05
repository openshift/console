import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { VMKind } from '../../../types';
import { V1GPU } from '../../../types/api';
import { gpuDevicePath } from './consts';
import { HardwareDevicesModal } from './HardwareDevicesModal';

export type GPUDevicesModalProps = {
  vmLikeEntity: VMKind | TemplateKind;
  vmDevices: V1GPU[];
  vmiDevices?: V1GPU[];
  isVMRunning?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;

export const GPUDevicesModal: React.FC<GPUDevicesModalProps> = ({
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
    <div className="pf-c-empty-state">{t('kubevirt-plugin~No GPU devices found')}</div>
  );

  return (
    <HardwareDevicesModal
      vmLikeEntity={vmLikeEntity}
      patchPath={gpuDevicePath}
      isVMRunning={isVMRunning}
      vmDevices={vmDevices}
      vmiDevices={vmiDevices}
      title={t('kubevirt-plugin~GPU devices')}
      emptyState={emptyState}
      addDeviceText={t('kubevirt-plugin~Add GPU device')}
      close={close}
      handlePromise={handlePromise}
      inProgress={inProgress}
      errorMessage={errorMessage}
    />
  );
};

export const gpuDevicesModal = createModalLauncher(withHandlePromise(GPUDevicesModal));
