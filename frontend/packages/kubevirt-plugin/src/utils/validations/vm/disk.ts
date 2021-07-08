import {
  asValidationObject,
  validateDNS1123SubdomainValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { StorageUISource } from '../../../components/modals/disk-modal/storage-ui-source';
import { VolumeType } from '../../../constants';
import { DiskType } from '../../../constants/vm/storage/disk-type';
import { CombinedDisk } from '../../../k8s/wrapper/vm/combined-disk';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { UIStorageValidation } from '../../../types/ui/storage';
import { validateContainer, validateURL } from '../common';
import { TemplateValidations } from '../template/template-validations';

const validateDiskName = (name: string, usedDiskNames: Set<string>): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name, {
    // t('kubevirt-plugin~Disk name cannot be empty')
    // t('kubevirt-plugin~Disk name name can contain only alphanumeric characters')
    // t('kubevirt-plugin~Disk name must start/end with alphanumeric character')
    // t('kubevirt-plugin~Disk name cannot contain uppercase characters')
    // t('kubevirt-plugin~Disk name is too long')
    // t('kubevirt-plugin~Disk name is too short')
    emptyMsg: 'kubevirt-plugin~Disk name cannot be empty',
    errorMsg: 'kubevirt-plugin~Disk name name can contain only alphanumeric characters',
    startEndAlphanumbericMsg:
      'kubevirt-plugin~Disk name must start/end with alphanumeric character',
    uppercaseMsg: 'kubevirt-plugin~Disk name cannot contain uppercase characters',
    longMsg: 'kubevirt-plugin~Disk name is too long',
    shortMsg: 'kubevirt-plugin~Disk name is too short',
  });

  if (!validation && usedDiskNames && usedDiskNames.has(name)) {
    // t('kubevirt-plugin~Disk with this name already exists!')
    validation = asValidationObject('kubevirt-plugin~Disk with this name already exists!');
  }

  return validation;
};

const validatePVCName = (pvcName: string, usedPVCNames: Set<string>): ValidationObject => {
  if (usedPVCNames && usedPVCNames.has(pvcName)) {
    // t('kubevirt-plugin~PVC with this name is already used by this VM!')
    return asValidationObject('kubevirt-plugin~PVC with this name is already used by this VM!');
  }

  if (!pvcName) {
    // t('kubevirt-plugin~PVC cannot be empty')
    return asValidationObject('kubevirt-plugin~PVC cannot be empty');
  }

  return null;
};

const getEmptyDiskSizeValidation = (): ValidationObject =>
  // t('kubevirt-plugin~Size must be positive')
  asValidationObject('kubevirt-plugin~Size must be positive', ValidationErrorType.TrivialError);

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
  let hasAllRequiredFilled = disk && disk.getName() && disk.getType() && volume && volume.getName();

  const validations = {
    name: validateDiskName(disk && disk.getName(), usedDiskNames),
    size: null,
    url: null,
    container: null,
    diskInterface: null,
    pvc: null,
    type: null,
  };

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

  if (source.requiresVolumeType()) {
    addRequired(volume && volume.hasType());
  }

  if (source.requiresURL()) {
    const url = dataVolume && dataVolume.getURL();
    addRequired(url);
    validations.url = validateURL(url);
  }

  if (source.requiresContainerImage()) {
    const container =
      volume.getType() === VolumeType.CONTAINER_DISK
        ? volume.getContainerImage()
        : dataVolume?.getContainer();
    addRequired(container);
    validations.container = validateContainer(container);
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
    }).getPVCNameBySource(source);
    addRequired(pvcName);
    validations.pvc = validatePVCName(pvcName, usedPVCNames);
  }

  if (disk.getType() !== DiskType.FLOPPY) {
    addRequired(disk.getDiskBus());
    validations.diskInterface = tValidations
      .validateBus(disk.getType(), disk.getDiskBus())
      .asValidationObject();
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
