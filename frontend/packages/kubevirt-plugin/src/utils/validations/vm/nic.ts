import { EntityMap } from '@console/shared';
import { validateDNS1123SubdomainValue, ValidationErrorType } from '../common';
import { addMissingSubject } from '../../grammar';

export const validateNicName = (name: string, interfaceLookup: EntityMap<any>) => {
  let validation = validateDNS1123SubdomainValue(name);

  if (validation) {
    validation.message = addMissingSubject(validation.message, 'Name');
  }

  if (!validation && interfaceLookup[name]) {
    validation = {
      type: ValidationErrorType.Error,
      message: 'Interface with this name already exists!',
    };
  }

  return validation;
};
