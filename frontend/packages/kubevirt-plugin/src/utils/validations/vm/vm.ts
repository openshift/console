import { TemplateKind } from '@console/internal/module/k8s';
import {
  asValidationObject,
  ValidationErrorType,
  ValidationObject,
  validateDNS1123SubdomainValue,
} from '@console/shared';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { validateEntityAlreadyExists } from '../common';

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
  const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(userTemplate, {
    convertTemplateDataVolumesToAttachClonedDisk: true,
  });

  return provisionSourceDetails.error
    ? asValidationObject(`Could not select Provision Source. ${provisionSourceDetails.error}`)
    : null;
};
