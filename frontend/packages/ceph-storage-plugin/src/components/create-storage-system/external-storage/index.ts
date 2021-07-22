import { ExternalStorage } from './types';
import { rhcsCanGoToNextStep, ConnectionDetails, rhcsPayload } from './red-hat-ceph-storage';
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
];
