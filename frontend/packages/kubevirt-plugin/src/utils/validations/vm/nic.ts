import { validateDNS1123SubdomainValue, VALIDATION_ERROR_TYPE } from 'kubevirt-web-ui-components';
import { EntityMap } from '../../../types';

export const validateNicName = (name: string, interfaceLookup: EntityMap<any>) => {
  let validation = validateDNS1123SubdomainValue(name);

  if (!validation && interfaceLookup[name]) {
    validation = {
      type: VALIDATION_ERROR_TYPE,
      message: 'Interface with this name already exists!',
    };
  }

  return validation;
};

export const validateDiskName = (name: string, diskLookup: EntityMap<any>) => {
  let validation = validateDNS1123SubdomainValue(name);

  if (!validation && diskLookup[name]) {
    validation = {
      type: VALIDATION_ERROR_TYPE,
      message: 'Disk with this name already exists!',
    };
  }

  return validation;
};
