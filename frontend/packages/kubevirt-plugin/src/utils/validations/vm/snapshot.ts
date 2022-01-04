import { validateDNS1123SubdomainValue } from '../..';
import { asValidationObject, ValidationObject } from '../../../selectors';

export const validateSnapshotName = (
  name: string,
  usedSnapshotNames: Set<string>,
): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name, {
    // t('kubevirt-plugin~Snapshot name cannot be empty')
    // t('kubevirt-plugin~Snapshot name can contain only alphanumeric characters')
    // t('kubevirt-plugin~Snapshot name must start/end with alphanumeric characters')
    // t('kubevirt-plugin~Snapshot name cannot contain uppercase characters')
    // t('kubevirt-plugin~Snapshot name is too long')
    // t('kubevirt-plugin~Snapshot name is too short')
    emptyMsg: 'kubevirt-plugin~Snapshot name cannot be empty',
    errorMsg: 'kubevirt-plugin~Snapshot name can contain only alphanumeric characters',
    startEndAlphanumbericMsg:
      'kubevirt-plugin~Snapshot name must start/end with alphanumeric characters',
    uppercaseMsg: 'kubevirt-plugin~Snapshot name cannot contain uppercase characters',
    longMsg: 'kubevirt-plugin~Snapshot name is too long',
    shortMsg: 'kubevirt-plugin~Snapshot name is too short',
  });

  if (!validation && usedSnapshotNames && usedSnapshotNames.has(name)) {
    // t('kubevirt-plugin~Snapshot with this name already exists!')
    validation = asValidationObject('kubevirt-plugin~Snapshot with this name already exists!');
  }

  return validation;
};
