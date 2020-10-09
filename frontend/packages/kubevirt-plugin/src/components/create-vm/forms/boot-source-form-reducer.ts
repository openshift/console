import { PersistentVolumeClaimModel } from '@console/internal/models';
import { ValidationObject } from '@console/shared';

import {
  validatePositiveInteger,
  validateTrim,
  validateURL,
} from '../../../utils/validations/common';
import { AccessMode, DataVolumeSourceType } from '../../../constants';

export type BootSourceState = {
  dataSource: {
    value: string;
  };
  size: {
    value: {
      value: number;
      unit: string;
    };
    validation: ValidationObject;
  };
  isValid: boolean;
  cdRom?: { value: boolean };
  file?: {
    value: {
      name: string;
      value: File;
    };
  };
  url?: {
    value: string;
    validation: ValidationObject;
  };
  container?: { value: string; validation: ValidationObject };
  pvcName?: { value: string };
  pvcNamespace?: { value: string };
  pvcSize?: { value: string };
  storageClass: { value: string };
  accessMode: { value: string };
  accessModes: { value: string[] };
};

export enum BOOT_ACTION_TYPE {
  RESET = 'reset',
  SET_DATA_SOURCE = 'dataSource',
  SET_FILE = 'file',
  SET_SIZE = 'size',
  SET_CD_ROM = 'cdRom',
  SET_URL = 'url',
  SET_CONTAINER = 'container',
  SET_PVC_NAME = 'pvcName',
  SET_PVC_NAMESPACE = 'pvcNamespace',
  SET_PVC_SIZE = 'pvcSize',
  SET_STORAGE_CLASS = 'storageClass',
  SET_ACCESS_MODES = 'accessModes',
  SET_ACCESS_MODE = 'accessMode',
}

export type BootSourceAction =
  | { type: BOOT_ACTION_TYPE.RESET }
  | { type: BOOT_ACTION_TYPE.SET_DATA_SOURCE; payload: BootSourceState['dataSource']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_FILE; payload: BootSourceState['file']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_SIZE; payload: BootSourceState['size']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_CD_ROM; payload: BootSourceState['cdRom']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_URL; payload: BootSourceState['url']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_CONTAINER; payload: BootSourceState['container']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_PVC_NAME; payload: BootSourceState['pvcName']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_PVC_NAMESPACE; payload: BootSourceState['pvcNamespace']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_PVC_SIZE; payload: BootSourceState['pvcSize']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_STORAGE_CLASS; payload: BootSourceState['storageClass']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_ACCESS_MODES; payload: BootSourceState['accessModes']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_ACCESS_MODE; payload: BootSourceState['accessMode']['value'] };

export const initBootFormState: BootSourceState = {
  dataSource: undefined,
  file: undefined,
  size: {
    value: {
      value: 20,
      unit: 'Gi',
    },
    validation: undefined,
  },
  cdRom: { value: false },
  url: undefined,
  container: undefined,
  pvcName: undefined,
  pvcNamespace: undefined,
  isValid: false,
  pvcSize: undefined,
  storageClass: undefined,
  accessMode: { value: AccessMode.READ_WRITE_ONCE.getValue() },
  accessModes: { value: [AccessMode.READ_WRITE_ONCE.getValue()] },
};

export const bootFormReducer = (
  state: BootSourceState,
  action: BootSourceAction,
): BootSourceState => {
  if (action.type === BOOT_ACTION_TYPE.RESET) {
    return initBootFormState;
  }

  const newState = {
    ...state,
    [action.type]: { value: action.payload },
  };
  let isValid: boolean;
  const sizeValidation = validatePositiveInteger(`${newState.size?.value.value}`, {
    subject: `${PersistentVolumeClaimModel.label} size`,
  });
  newState.size.validation = sizeValidation;
  switch (DataVolumeSourceType.fromString(newState.dataSource?.value)) {
    case DataVolumeSourceType.UPLOAD: {
      isValid = !!newState.file?.value.name && !!newState.file?.value && !newState.size.validation;
      break;
    }
    case DataVolumeSourceType.HTTP: {
      if (newState.url?.value) {
        newState.url.validation = validateURL(newState.url?.value, { subject: 'Import URL' });
      }
      isValid = !!newState.url?.value && !newState.url?.validation && !newState.size.validation;
      break;
    }
    case DataVolumeSourceType.REGISTRY: {
      if (newState.container?.value) {
        newState.container.validation = validateTrim(newState.container?.value, {
          subject: 'Container registry',
        });
      }
      isValid =
        !!newState.container?.value && !newState.container?.validation && !newState.size.validation;
      break;
    }
    case DataVolumeSourceType.PVC: {
      isValid = !!newState.pvcName?.value && !!newState.pvcNamespace?.value;
      break;
    }
    default: {
      isValid = false;
    }
  }
  newState.isValid = isValid;
  return newState;
};
