import {
  addMissingSubject,
  asValidationObject,
  makeSentence,
  validateDNS1123SubdomainValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { validateTrim, validateURL } from '../common';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { POSITIVE_SIZE_ERROR } from '../strings';
import { StorageUISource } from '../../../components/modals/disk-modal/storage-ui-source';
import { CombinedDisk } from '../../../k8s/wrapper/vm/combined-disk';
import { PersistentVolumeClaimWrapper } from '../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { DiskType } from '../../../constants/vm/storage/disk-type';
import { TemplateValidations } from '../template/template-validations';
import { UIStorageValidation } from '../../../types/ui/storage';

const validateDiskName = (name: string, usedDiskNames: Set<string>): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name);

  if (validation) {
    validation.message = addMissingSubject(validation.message, 'Name');
  }

  if (!validation && usedDiskNames && usedDiskNames.has(name)) {
    validation = asValidationObject('Disk with this name already exists!');
  }

  return validation;
};

const validatePVCName = (pvcName: string, usedPVCNames: Set<string>): ValidationObject => {
  if (usedPVCNames && usedPVCNames.has(pvcName)) {
    asValidationObject('PVC with this name is already used by this VM!');
  }

  return null;
};

const getEmptyDiskSizeValidation = (): ValidationObject =>
  asValidationObject(
    makeSentence(addMissingSubject(POSITIVE_SIZE_ERROR, 'Size')),
    ValidationErrorType.TrivialError,
  );

export const validateDisk = (
  disk: DiskWrapper,
  volume: VolumeWrapper,
  dataVolume: DataVolumeWrapper,
  persistentVolumeClaimWrapper: PersistentVolumeClaimWrapper,
  {
    usedDiskNames,
    usedPVCNames,
    templateValidations,
  }: {
    usedDiskNames?: Set<string>;
    usedPVCNames?: Set<string>;
    templateValidations: TemplateValidations;
  },
): UIStorageValidation => {
  const validations = {
    name: validateDiskName(disk && disk.getName(), usedDiskNames),
    size: null,
    url: null,
    container: null,
    diskInterface: null,
    pvc: null,
  };
  let hasAllRequiredFilled = disk && disk.getName() && volume && volume.getName();

  const addRequired = (addon) => {
    if (hasAllRequiredFilled) {
      hasAllRequiredFilled = hasAllRequiredFilled && addon;
    }
  };

  const source = StorageUISource.fromTypes(
    volume && volume.getType(),
    dataVolume && dataVolume.getType(),
    !!persistentVolumeClaimWrapper,
  );

  const tValidations = templateValidations || new TemplateValidations();
  const diskType = disk.getType();

  if (source.requiresVolumeType()) {
    addRequired(volume && volume.hasType());
  }

  if (source.requiresURL()) {
    const url = dataVolume && dataVolume.getURL();
    addRequired(url);
    validations.url = validateURL(url, { subject: 'URL' });
  }

  if (source.requiresContainerImage()) {
    const container = volume.getContainerImage();
    addRequired(container);
    validations.container = validateTrim(container, { subject: 'Container' });
  }

  if (source.requiresDatavolume()) {
    addRequired(dataVolume);
  }

  if (source.requiresNewPVC()) {
    addRequired(persistentVolumeClaimWrapper);
  }

  if (source.requiresSize()) {
    let missingSize;
    if (source.requiresDatavolume()) {
      missingSize = !dataVolume || !dataVolume.hasSize();
    }
    if (source.requiresNewPVC()) {
      missingSize =
        missingSize || !persistentVolumeClaimWrapper || !persistentVolumeClaimWrapper.hasSize();
    }

    if (missingSize) {
      addRequired(null);
      validations.size = getEmptyDiskSizeValidation();
    }
  }

  if (source.requiresPVC()) {
    const pvcName = new CombinedDisk({
      diskWrapper: disk,
      volumeWrapper: volume,
      dataVolumeWrapper: dataVolume,
      persistentVolumeClaimWrapper,
      isNewPVC: !!persistentVolumeClaimWrapper,
    }).getPVCName(source);
    addRequired(pvcName);
    validations.pvc = validatePVCName(pvcName, usedPVCNames);
  }

  if (diskType !== DiskType.FLOPPY) {
    addRequired(disk.getDiskBus());
    validations.diskInterface = tValidations.validateBus(disk.getDiskBus()).asValidationObject();
  }

  return {
    validations,
    hasAllRequiredFilled: !!hasAllRequiredFilled,
    isValid:
      !!hasAllRequiredFilled &&
      !Object.keys(validations).find(
        (key) =>
          validations[key] &&
          (validations[key].type === ValidationErrorType.Error ||
            validations[key].type === ValidationErrorType.TrivialError),
      ),
  };
};
