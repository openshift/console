import { PersistentVolumeClaimKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { BOOT_SOURCE_COMMUNITY, BOOT_SOURCE_USER } from '../../constants';

export enum SOURCE_TYPE {
  BASE_IMAGE = 'BASE_IMAGE',
  PXE = 'PXE',
  DATA_VOLUME = 'DATA_VOLUME',
  DATA_VOLUME_TEMPLATE = 'DATA_VOLUME_TEMPLATE',
  PVC = 'PVC',
  CONTAINER = 'CONTAINER',
}

type GetTemplateSourceStatusProps = {
  template: TemplateKind;
  pods: PodKind[];
  pvcs: PersistentVolumeClaimKind[];
  dataVolumes: V1alpha1DataVolume[];
};

export type TemplateSourceStatusError = {
  error: React.ReactNode;
  pod?: PodKind;
  alert?: boolean;
  dataVolume?: V1alpha1DataVolume;
  pvc?: PersistentVolumeClaimKind;
};

export type TemplateSourceStatusBundle = {
  isReady: boolean;
  source: SOURCE_TYPE;
  provider: typeof BOOT_SOURCE_COMMUNITY | typeof BOOT_SOURCE_USER;
  isCDRom: boolean;
  pod?: PodKind;
  dataVolume?: V1alpha1DataVolume;
  pvc?: PersistentVolumeClaimKind;
  container?: string;
  dvTemplate?: V1alpha1DataVolume;
  pxe?: string;
};

export type TemplateSourceStatus = TemplateSourceStatusError | TemplateSourceStatusBundle;

export type GetTemplateSourceStatus = (args: GetTemplateSourceStatusProps) => TemplateSourceStatus;

export const isTemplateSourceError = (
  templateSourceStatus: TemplateSourceStatus,
): templateSourceStatus is TemplateSourceStatusError =>
  templateSourceStatus?.hasOwnProperty('error');
