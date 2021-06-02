import { asValidationObject, ValidationObject } from '@console/shared';
import { AccessMode } from '../../../constants';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import {
  isPositiveNumber,
  validateContainer,
  validateURL,
} from '../../../utils/validations/common';

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
  pvcVolumeMode?: { value: string };
  pvcSize?: { value: string };
  storageClass: { value: string };
  accessMode: { value: string };
  provider?: { value: string };
  volumeMode: { value: string };
  volumeModeFlag: { value: boolean };
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
  SET_ACCESS_MODE = 'accessMode',
  SET_PROVIDER = 'provider',
  SET_VOLUME_MODE = 'volumeMode',
  SET_PVC_VOLUME_MODE = 'pvcVolumeMode',
  SET_VOLUME_MODE_FLAG = 'volumeModeFlag',
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
  | {
      type: BOOT_ACTION_TYPE.SET_PVC_VOLUME_MODE;
      payload: BootSourceState['pvcVolumeMode']['value'];
    }
  | {
      type: BOOT_ACTION_TYPE.SET_VOLUME_MODE_FLAG;
      payload: BootSourceState['volumeModeFlag']['value'];
    }
  | { type: BOOT_ACTION_TYPE.SET_PVC_NAMESPACE; payload: BootSourceState['pvcNamespace']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_PVC_SIZE; payload: BootSourceState['pvcSize']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_STORAGE_CLASS; payload: BootSourceState['storageClass']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_ACCESS_MODE; payload: BootSourceState['accessMode']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_VOLUME_MODE; payload: BootSourceState['volumeMode']['value'] }
  | { type: BOOT_ACTION_TYPE.SET_PROVIDER; payload: BootSourceState['provider']['value'] };

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
  pvcVolumeMode: undefined,
  isValid: false,
  pvcSize: undefined,
  storageClass: undefined,
  accessMode: { value: AccessMode.READ_WRITE_ONCE.getValue() },
  provider: undefined,
  volumeMode: undefined,
  volumeModeFlag: { value: false },
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
  // t('kubevirt-plugin~Size can not be empty')
  // t('kubevirt-plugin~Size must be positive integer')
  const sizeValidation = !newState.size?.value.value
    ? asValidationObject('kubevirt-plugin~Size can not be empty')
    : isPositiveNumber(newState.size.value.value)
    ? null
    : asValidationObject('kubevirt-plugin~Size must be positive integer');
  newState.size.validation = sizeValidation;
  switch (ProvisionSource.fromString(newState.dataSource?.value)) {
    case ProvisionSource.UPLOAD: {
      isValid = !!newState.file?.value.name && !!newState.file?.value && !newState.size.validation;
      break;
    }
    case ProvisionSource.URL: {
      if (newState.url?.value) {
        newState.url.validation = validateURL(newState.url?.value);
      }
      isValid = !!newState.url?.value && !newState.url?.validation && !newState.size.validation;
      break;
    }
    case ProvisionSource.CONTAINER: {
      if (newState.container?.value) {
        newState.container.validation = validateContainer(newState.container?.value);
      }
      isValid =
        !!newState.container?.value && !newState.container?.validation && !newState.size.validation;
      break;
    }
    case ProvisionSource.DISK: {
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
