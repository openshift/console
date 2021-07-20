import { ExtensionK8sModel } from '@console/dynamic-plugin-sdk/src';
import { SUPPORTED_EXTERNAL_STORAGE } from '../components/create-storage-system/external-storage';
import { WizardState } from '../components/create-storage-system/reducer';

export const getStorageSystemKind = ({ kind, version, group }: ExtensionK8sModel) =>
  `${kind.toLowerCase()}.${group}/${version}`;

export const createExternalSSName = (id: string = '') => id.toLowerCase().replace(' ', '-');

export const getExternalStorage = (id: WizardState['backingStorage']['externalStorage'] = '') =>
  SUPPORTED_EXTERNAL_STORAGE.find((p) => p.model.kind === id);
