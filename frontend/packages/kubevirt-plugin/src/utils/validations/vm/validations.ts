import { getName, getNamespace } from '@console/shared';
import { VIRTUAL_MACHINE_EXISTS } from '../strings';
import { getValidationObject, validateDNS1123SubdomainValue, ValidationErrorType } from '../common';

export const vmAlreadyExists = (name, namespace, vms) => {
  const exists = vms && vms.some((vm) => getNamespace(vm) === namespace && getName(vm) === name);
  return exists ? getValidationObject(VIRTUAL_MACHINE_EXISTS) : null;
};

export const validateVmName = (value, namespace, vms) => {
  const dnsValidation = validateDNS1123SubdomainValue(value);
  return dnsValidation && dnsValidation.type === ValidationErrorType.Error
    ? dnsValidation
    : vmAlreadyExists(value, namespace, vms);
};
