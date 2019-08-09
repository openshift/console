import { EntityMap } from '@console/shared';
import { getValidationObject, validateDNS1123SubdomainValue, ValidationObject } from '../common';
import { addMissingSubject, makeSentence } from '../../grammar';
import { MAC_ADDRESS_INVALID_ERROR, NIC_NAME_EXISTS } from '../strings';
import { isValidMAC } from './validations';

export const validateNicName = (
  name: string,
  interfaceLookup: EntityMap<any>,
): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name);

  if (validation) {
    validation.message = addMissingSubject(validation.message, 'Name');
  }

  if (!validation && interfaceLookup[name]) {
    validation = getValidationObject(NIC_NAME_EXISTS);
  }

  return validation;
};

export const validateMACAddress = (mac: string): ValidationObject => {
  const isValid = mac === '' || (mac && isValidMAC(mac));
  return isValid ? null : getValidationObject(makeSentence(MAC_ADDRESS_INVALID_ERROR));
};
