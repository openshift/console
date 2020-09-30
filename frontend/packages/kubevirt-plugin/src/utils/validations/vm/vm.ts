import { TemplateKind } from '@console/internal/module/k8s';
import {
  asValidationObject,
  validateDNS1123SubdomainValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { getValidationByType, validateEntityAlreadyExists } from '../common';
import { UIValidation, UIValidationType } from '../../../types/ui/ui';

export const validateVmLikeEntityName = (
  value: string,
  namespace: string,
  vmLikeEntities,
  {
    existsErrorMessage,
    subject,
    validations,
  }: { existsErrorMessage: string; subject: string; validations?: UIValidation[] } = {
    existsErrorMessage: undefined,
    subject: undefined,
    validations: undefined,
  },
): ValidationObject => {
  const lenValidation = getValidationByType(validations, UIValidationType.LENGTH);
  const dnsValidation = validateDNS1123SubdomainValue(value, {
    subject,
    min: lenValidation?.settings?.min,
    max: lenValidation?.settings?.max,
  });

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
  const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(userTemplate, {
    convertTemplateDataVolumesToAttachClonedDisk: true,
  });

  return provisionSourceDetails.error
    ? asValidationObject(`Could not select Provision Source. ${provisionSourceDetails.error}`)
    : null;
};
