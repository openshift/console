import * as _ from 'lodash';
import {
  asValidationObject,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared/src/utils/validation';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { UIValidation } from '../../../../types/ui/ui';
import {
  iGet,
  iGetLoadedData,
  iGetLoadError,
  immutableListToJS,
} from '../../../../utils/immutable';
import { isPositiveNumber } from '../../../../utils/validations/common';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';
import { combineIntegerValidationResults } from '../../../../utils/validations/template/utils';
import { validateVmLikeEntityName } from '../../../../utils/validations/vm';
import { BinaryUnit, convertToBytes } from '../../../form/size-unit-utils';
import { iGetFieldValue } from '../../selectors/immutable/field';
import {
  checkTabValidityChanged,
  iGetCommonData,
  iGetLoadedCommonData,
  immutableListToShallowMetadataJS,
} from '../../selectors/immutable/selectors';
import { hasVmSettingsChanged, iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { getTemplateValidations } from '../../selectors/template';
import { VMSettingsField, VMWizardProps, VMWizardTab } from '../../types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions, ValidationConfig, Validator } from '../types';
import { getFieldsValidity, getValidationUpdate } from './utils';

const validateVm: Validator = (field, options) => {
  const { getState, id } = options;
  const state = getState();

  const isCreateTemplate = iGetCommonData(state, id, VMWizardProps.isCreateTemplate);

  const entities = isCreateTemplate
    ? iGetLoadedCommonData(state, id, VMWizardProps.userTemplates)
    : iGetLoadedCommonData(state, id, VMWizardProps.virtualMachines);

  return validateVmLikeEntityName(
    iGetFieldValue(field),
    iGetCommonData(state, id, VMWizardProps.activeNamespace),
    immutableListToShallowMetadataJS(entities),
    // t('kubevirt-plugin~Name is already used by another template')
    // t('kubevirt-plugin~Name is already used by another virtual machine in this namespace')
    {
      existsErrorMessage: isCreateTemplate
        ? 'kubevirt-plugin~Name is already used by another template'
        : 'kubevirt-plugin~Name is already used by another virtual machine in this namespace',
      validations: immutableListToJS(iGet(field, 'validations')) as UIValidation[],
    },
  );
};

export const validateCPU: Validator = (field) => {
  const cpu = iGetFieldValue(field);
  if (!cpu) {
    // t('kubevirt-plugin~CPU can not be empty')
    return asValidationObject(
      'kubevirt-plugin~CPU can not be empty',
      ValidationErrorType.TrivialError,
    );
  }
  // t('kubevirt-plugin~CPU must be positive integer')
  return isPositiveNumber(cpu)
    ? null
    : asValidationObject('kubevirt-plugin~CPU must be positive integer');
};

export const validateOperatingSystem: Validator = (field) => {
  const os = iGetFieldValue(field);
  const guestFullName = iGet(field, 'guestFullName');

  if (os || !guestFullName) {
    return os
      ? null
      : asValidationObject(
          // t('kubevirt-plugin~Operating system cannot be empty')
          'kubevirt-plugin~Operating system cannot be empty',
          ValidationErrorType.TrivialError,
        );
  }

  // t('kubevirt-plugin~Select matching for: {{guestFullName}}')
  return asValidationObject(
    `kubevirt-plugin~Select matching for: ${guestFullName}`,
    ValidationErrorType.Info,
  );
};

const memoryValidation: Validator = (field, options): ValidationObject => {
  const memValue = iGetFieldValue(field);
  if (memValue == null || memValue === '' || BinaryUnit[memValue]) {
    // t('kubevirt-plugin~Memory can not be empty')
    return memValue
      ? null
      : asValidationObject(
          'kubevirt-plugin~Memory can not be empty',
          ValidationErrorType.TrivialError,
        );
  }
  const { id, getState } = options;
  const state = getState();
  const memValueBytes = convertToBytes(memValue);

  const validations = getTemplateValidations(state, id);
  if (validations.length === 0) {
    validations.push(new TemplateValidations()); // add empty validation for positive integer if it is missing one
  }

  const validationResults = validations
    .map((v) => v.validateMemory(memValueBytes))
    .filter(({ isValid }) => !isValid);

  if (validationResults.length === validations.length) {
    // every template failed its validations - we cannot choose one
    return combineIntegerValidationResults(validationResults, {
      defaultMin: 0,
      isDefaultMinInclusive: false,
    });
  }

  if (memValue.match(/^[0-9.]+B$/)) {
    // t('kubevirt-plugin~Memory must be specified at least in KiB units')
    return asValidationObject('kubevirt-plugin~Memory must be specified at least in KiB units');
  }

  return null;
};

const validateSource: Validator = (field, options): ValidationObject => {
  const value = iGetFieldValue(field);

  if (value === ProvisionSource.PXE.getValue()) {
    const { getState, id } = options;
    const state = getState();

    const nads = iGetCommonData(state, id, VMWizardProps.nads);
    return iGetLoadError(nads)
      ? asValidationObject(
          // t('kubevirt-plugin~Error fetching available Network Attachment Definitions. PXE capable Network Attachment Definition is required to successfully create this virtual machine. Contact your system administrator for additional support.')
          'kubevirt-plugin~Error fetching available Network Attachment Definitions. PXE capable Network Attachment Definition is required to successfully create this virtual machine. Contact your system administrator for additional support.',
        )
      : iGetLoadedData(nads)?.size === 0
      ? asValidationObject(
          // t('kubevirt-plugin~No Network Attachment Definitions available. PXE capable Network Attachment Definition is required to successfully create this virtual machine. Contact your system administrator for additional support.')
          'kubevirt-plugin~No Network Attachment Definitions available. PXE capable Network Attachment Definition is required to successfully create this virtual machine. Contact your system administrator for additional support.',
        )
      : null;
  }

  return null;
};

const validationConfig: ValidationConfig = {
  [VMSettingsField.NAME]: {
    detectValueChanges: [VMSettingsField.NAME],
    detectCommonDataChanges: (field, options) => {
      const isCreateTemplate = iGetCommonData(
        options.getState(),
        options.id,
        VMWizardProps.isCreateTemplate,
      );
      return isCreateTemplate
        ? [VMWizardProps.activeNamespace, VMWizardProps.userTemplates]
        : [VMWizardProps.activeNamespace, VMWizardProps.virtualMachines];
    },
    validator: validateVm,
  },
  [VMSettingsField.OPERATING_SYSTEM]: {
    detectValueChanges: [VMSettingsField.OPERATING_SYSTEM],
    validator: validateOperatingSystem,
  },
  [VMSettingsField.CPU]: {
    detectValueChanges: [VMSettingsField.CPU],
    validator: validateCPU,
  },
  [VMSettingsField.MEMORY]: {
    detectValueChanges: [
      VMSettingsField.MEMORY,
      VMSettingsField.OPERATING_SYSTEM,
      VMSettingsField.WORKLOAD_PROFILE,
    ],
    detectCommonDataChanges: [VMWizardProps.userTemplate, VMWizardProps.commonTemplates],
    validator: memoryValidation,
  },
  [VMSettingsField.PROVISION_SOURCE_TYPE]: {
    detectValueChanges: [VMSettingsField.PROVISION_SOURCE_TYPE],
    validator: validateSource,
  },
};

export const validateVmSettings = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const vmSettings = iGetVmSettings(state, id);

  const update = getValidationUpdate(validationConfig, options, vmSettings, hasVmSettingsChanged);

  if (!_.isEmpty(update)) {
    dispatch(vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, update));
  }
};

export const setVmSettingsTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const vmSettings = iGetVmSettings(state, id);
  const { hasAllRequiredFilled, isValid, errorKey, fieldKeys } = getFieldsValidity(vmSettings);

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.VM_SETTINGS,
      isValid,
      hasAllRequiredFilled,
      errorKey,
      fieldKeys,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.VM_SETTINGS,
        isValid,
        hasAllRequiredFilled,
        errorKey,
        fieldKeys,
      ),
    );
  }
};
