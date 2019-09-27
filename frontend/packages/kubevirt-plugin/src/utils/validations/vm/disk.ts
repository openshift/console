import {
  getValidationObject,
  validateDNS1123SubdomainValue,
  validateTrim,
  validateURL,
} from '../common';
import { addMissingSubject, makeSentence } from '../../grammar';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { ValidationErrorType, ValidationObject } from '../types';
import { POSITIVE_SIZE_ERROR } from '../strings';
import { StorageUISource } from '../../../components/modals/disk-modal/storage-ui-source';

const validateDiskName = (name: string, usedDiskNames: Set<string>): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name);

  if (validation) {
    validation.message = addMissingSubject(validation.message, 'Name');
  }

  if (!validation && usedDiskNames && usedDiskNames.has(name)) {
    validation = getValidationObject('Disk with this name already exists!');
  }

  return validation;
};

const validatePVCName = (pvcName: string, usedPVCNames: Set<string>): ValidationObject => {
  if (usedPVCNames && usedPVCNames.has(pvcName)) {
    getValidationObject('PVC with this name is already used by this VM!');
  }

  return null;
};

const getEmptyDiskSizeValidation = (): ValidationObject =>
  getValidationObject(
    makeSentence(addMissingSubject(POSITIVE_SIZE_ERROR, 'Size')),
    ValidationErrorType.TrivialError,
  );

export const validateDisk = (
  disk: DiskWrapper,
  volume: VolumeWrapper,
  dataVolume: DataVolumeWrapper,
  {
    usedDiskNames,
    usedPVCNames,
  }: {
    usedDiskNames?: Set<string>;
    usedPVCNames?: Set<string>;
  },
): UIDiskValidation => {
  const validations = {
    name: validateDiskName(disk && disk.getName(), usedDiskNames),
    size: null,
    url: null,
    container: null,
    pvc: null,
  };
  let hasAllRequiredFilled = disk && disk.getName() && volume && volume.hasType();

  const addRequired = (addon) => {
    if (hasAllRequiredFilled) {
      hasAllRequiredFilled = hasAllRequiredFilled && addon;
    }
  };

  const type = StorageUISource.fromTypes(volume.getType(), dataVolume && dataVolume.getType());

  if (type) {
    if (type.requiresURL()) {
      const url = dataVolume && dataVolume.getURL();
      addRequired(url);
      validations.url = validateURL(url, { subject: 'URL' });
    }

    if (type.requiresContainerImage()) {
      const container = volume.getContainerImage();
      addRequired(container);
      validations.container = validateTrim(container, { subject: 'Container' });
    }

    if (type.requiresDatavolume()) {
      addRequired(dataVolume);
      if (!dataVolume || !dataVolume.hasSize()) {
        addRequired(null);
        validations.size = getEmptyDiskSizeValidation();
      }
    }

    if (type.requiresPVC()) {
      const pvcName = type.getPVCName(volume, dataVolume);
      addRequired(pvcName);
      validations.pvc = validatePVCName(pvcName, usedPVCNames);
    }
  }

  return {
    validations,
    hasAllRequiredFilled: !!hasAllRequiredFilled,
    isValid: !!hasAllRequiredFilled && !Object.keys(validations).find((key) => validations[key]),
  };
};

export type UIDiskValidation = {
  validations: {
    name?: ValidationObject;
    size?: ValidationObject;
    url?: ValidationObject;
    container?: ValidationObject;
    pvc?: ValidationObject;
  };
  isValid: boolean;
  hasAllRequiredFilled: boolean;
};
