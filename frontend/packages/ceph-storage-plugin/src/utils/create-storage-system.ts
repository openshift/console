import { SUPPORTED_EXTERNAL_STORAGE } from '../components/create-storage-system/external-storage';
import { WizardState } from '../components/create-storage-system/reducer';

export const getStorageSystemKind = ({ kind, apiVersion, apiGroup }) =>
  `${kind.toLowerCase()}.${apiGroup}/${apiVersion}`;

export const createExternalSSName = (id: string = '') => id.toLowerCase().replace(/\s/g, '-');

export const getExternalStorage = (id: WizardState['backingStorage']['externalStorage'] = '') =>
  SUPPORTED_EXTERNAL_STORAGE.find((p) => p.model.kind === id);
