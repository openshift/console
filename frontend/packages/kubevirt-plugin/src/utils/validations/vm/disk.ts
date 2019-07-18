import { EntityMap } from '@console/shared';
import { validateDNS1123SubdomainValue, ValidationErrorType } from '../common';

export const validateDiskName = (name: string, diskLookup: EntityMap<any>) => {
  let validation = validateDNS1123SubdomainValue(name);

  if (!validation && diskLookup[name]) {
    validation = {
      type: ValidationErrorType.Error,
      message: 'Disk with this name already exists!',
    };
  }

  return validation;
};
