import { EntityMap } from '@console/shared';
import { validateDNS1123SubdomainValue } from '../common';
import { addMissingSubject } from '../../grammar';
import { ValidationErrorType } from '../types';

export const validateDiskName = (name: string, diskLookup: EntityMap<any>) => {
  let validation = validateDNS1123SubdomainValue(name);

  if (validation) {
    validation.message = addMissingSubject(validation.message, 'Name');
  }

  if (!validation && diskLookup[name]) {
    validation = {
      type: ValidationErrorType.Error,
      message: 'Disk with this name already exists!',
    };
  }

  return validation;
};
