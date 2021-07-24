import { ExternalStorage } from './types';
import { rhcsCanGoToNextStep, ConnectionDetails, rhcsPayload } from './red-hat-ceph-storage';
import {
  FlashsystemCanGoToNextStep,
  FlashsystemConnectionDetails,
  FlashsystemPayload,
} from './ibm-flashsystem/index';
import { IBMFlashsystemModel } from './ibm-flashsystem/models';
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
    displayName: 'IBM Flashsystem Storage',
    model: {
      apiGroup: IBMFlashsystemModel.apiGroup,
      apiVersion: IBMFlashsystemModel.apiVersion,
      kind: IBMFlashsystemModel.kind,
      plural: IBMFlashsystemModel.plural,
    },
    Component: FlashsystemConnectionDetails,
    createPayload: FlashsystemPayload,
    canGoToNextStep: FlashsystemCanGoToNextStep,
  },
];
