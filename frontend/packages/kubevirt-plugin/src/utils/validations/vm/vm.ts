import { TemplateKind } from '@console/internal/module/k8s';
import { ValidationErrorType, ValidationObject } from '../types';
import {
  getValidationObject,
  validateDNS1123SubdomainValue,
  validateEntityAlreadyExists,
} from '../common';
import { ProvisionSource } from '../../../constants/vm/provision-source';

export const validateVmLikeEntityName = (
  value: string,
  namespace: string,
  vmLikeEntities,
  { existsErrorMessage, subject }: { existsErrorMessage: string; subject: string } = {
    existsErrorMessage: undefined,
    subject: undefined,
  },
): ValidationObject => {
  const dnsValidation = validateDNS1123SubdomainValue(value, { subject });
  return dnsValidation && dnsValidation.type === ValidationErrorType.Error
    ? dnsValidation
    : validateEntityAlreadyExists(value, namespace, vmLikeEntities, {
        errorMessage: existsErrorMessage,
        subject,
      });
};

export const validateUserTemplateProvisionSource = (
  userTemplate: TemplateKind,
): ValidationObject => {
  const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(userTemplate);

  return provisionSourceDetails.error
    ? getValidationObject(`Could not select Provision Source. ${provisionSourceDetails.error}`)
    : null;
};
