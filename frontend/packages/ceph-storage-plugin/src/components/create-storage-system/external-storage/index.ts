import { ExternalStorage } from './types';
import { rhcsCanGoToNextStep, ConnectionDetails, rhcsPayload } from './red-hat-ceph-storage';
import { OCSServiceModel } from '../../../models';

export const SUPPORTED_EXTERNAL_STORAGE: ExternalStorage[] = [
  {
    displayName: 'Red Hat Ceph Storage',
    model: {
      group: OCSServiceModel.apiGroup,
      version: OCSServiceModel.apiVersion,
      kind: OCSServiceModel.kind,
    },
    Component: ConnectionDetails,
    createPayload: rhcsPayload,
    canGoToNextStep: rhcsCanGoToNextStep,
  },
];
