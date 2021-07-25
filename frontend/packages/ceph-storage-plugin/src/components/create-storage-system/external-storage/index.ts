import { ExternalStorage } from './types';
import { rhcsCanGoToNextStep, ConnectionDetails, rhcsPayload } from './red-hat-ceph-storage';
import {
  FlashSystemCanGoToNextStep,
  FlashSystemConnectionDetails,
  FlashSystemPayload,
} from './ibm-flashsystem/index';
import { IBMFlashSystemModel } from './ibm-flashsystem/models';
import { OCSServiceModel } from '../../../models';

export const SUPPORTED_EXTERNAL_STORAGE: ExternalStorage[] = [
  {
    displayName: 'Red Hat Ceph Storage',
    model: {
      apiGroup: OCSServiceModel.apiGroup,
      apiVersion: OCSServiceModel.apiVersion,
      kind: OCSServiceModel.kind,
      plural: OCSServiceModel.plural,
    },
    Component: ConnectionDetails,
    createPayload: rhcsPayload,
    canGoToNextStep: rhcsCanGoToNextStep,
  },
  {
    displayName: 'IBM FlashSystem Storage',
    model: {
      apiGroup: IBMFlashSystemModel.apiGroup,
      apiVersion: IBMFlashSystemModel.apiVersion,
      kind: IBMFlashSystemModel.kind,
      plural: IBMFlashSystemModel.plural,
    },
    Component: FlashSystemConnectionDetails,
    createPayload: FlashSystemPayload,
    canGoToNextStep: FlashSystemCanGoToNextStep,
  },
];
