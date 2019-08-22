import { K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import { ValidationErrorType, ValidationObject } from '../types';
import {
  getValidationObject,
  validateDNS1123SubdomainValue,
  validateEntityAlreadyExists,
} from '../common';
import { getTemplateProvisionSource } from '../../../selectors/vm-template/combined';
import { ProvisionSource } from '../../../types/vm';

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
  dataVolumes: K8sResourceKind[],
): ValidationObject => {
  const provisionSource = getTemplateProvisionSource(userTemplate, dataVolumes);

  return provisionSource.type === ProvisionSource.UNKNOWN
    ? getValidationObject(`Could not select Provision Source. ${provisionSource.error}`)
    : null;
};
