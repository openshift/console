import { TemplateKind } from '@console/internal/module/k8s';
import {
  asValidationObject,
  validateDNS1123SubdomainValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { ProvisionSource } from '../../../constants/vm/provision-source';
import { validateEntityAlreadyExists } from '../common';
import { UIValidation, UIValidationType } from '../../../types/ui/ui';

export const validateVmLikeEntityName = (
  value: string,
  namespace: string,
  vmLikeEntities,
  {
    existsErrorMessage,
    validations,
  }: { existsErrorMessage: string; validations?: UIValidation[] } = {
    existsErrorMessage: undefined,
    validations: undefined,
  },
): ValidationObject => {
  const lenValidation = validations?.find((val) => val.type === UIValidationType.LENGTH);
  const dnsValidation = validateDNS1123SubdomainValue(
    value,
    {
      // t('kubevirt-plugin~VM name cannot be empty')
      // t('kubevirt-plugin~VM name name can contain only alphanumberic characters')
      // t('kubevirt-plugin~VM name cannot start/end with dash')
      // t('kubevirt-plugin~VM name cannot contain uppercase characters')
      // t('kubevirt-plugin~VM name is too long')
      // t('kubevirt-plugin~VM name is too short')
      emptyMsg: 'kubevirt-plugin~VM name cannot be empty',
      errorMsg: 'kubevirt-plugin~VM name name can contain only alphanumberic characters',
      dashMsg: 'kubevirt-plugin~VM name cannot start/end with dash',
      uppercaseMsg: 'kubevirt-plugin~VM name cannot contain uppercase characters',
      longMsg: 'kubevirt-plugin~VM name is too long',
      shortMsg: 'kubevirt-plugin~VM name is too short',
    },
    {
      min: lenValidation?.settings?.min,
      max: lenValidation?.settings?.max,
    },
  );

  return dnsValidation && dnsValidation.type === ValidationErrorType.Error
    ? dnsValidation
    : validateEntityAlreadyExists(value, namespace, vmLikeEntities, {
        errorMessage: existsErrorMessage,
      });
};

export const validateUserTemplateProvisionSource = (
  userTemplate: TemplateKind,
): ValidationObject => {
  const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(userTemplate, {
    convertTemplateDataVolumesToAttachClonedDisk: true,
  });

  // t('kubevirt-plugin~Could not select Provision Source. {{ error }}')
  return provisionSourceDetails.error
    ? asValidationObject(
        `kubevirt-plugin~Could not select Provision Source. ${provisionSourceDetails.error}`,
      )
    : null;
};
