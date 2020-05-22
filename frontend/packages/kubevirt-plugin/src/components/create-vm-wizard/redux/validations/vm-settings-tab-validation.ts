import * as _ from 'lodash';
import {
  asValidationObject,
  validateEmptyValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared/src/utils/validation';
import { VMSettingsField, VMWizardProps, VMWizardTab } from '../../types';
import { hasVmSettingsChanged, iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { iGetFieldKey, iGetFieldValue } from '../../selectors/immutable/field';
import { InternalActionType, UpdateOptions, ValidationConfig, Validator } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import {
  validateUserTemplateProvisionSource,
  validateVmLikeEntityName,
} from '../../../../utils/validations/vm';
import {
  VIRTUAL_MACHINE_EXISTS,
  VIRTUAL_MACHINE_TEMPLATE_EXISTS,
} from '../../../../utils/validations/strings';
import { getFieldTitle } from '../../utils/renderable-field-utils';
import { concatImmutableLists, iGet } from '../../../../utils/immutable';
import {
  checkTabValidityChanged,
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
  immutableListToShallowMetadataJS,
} from '../../selectors/immutable/selectors';
import { validatePositiveInteger } from '../../../../utils/validations/common';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';
import { combineIntegerValidationResults } from '../../../../utils/validations/template/utils';
import { getFieldsValidity, getValidationUpdate } from './utils';
import { getTemplateValidations } from '../../selectors/template';
import { BinaryUnit, convertToBytes } from '../../../form/size-unit-utils';

const validateVm: Validator = (field, options) => {
  const { getState, id } = options;
  const state = getState();

  const isCreateTemplate = iGetCommonData(state, id, VMWizardProps.isCreateTemplate);

  const entities = isCreateTemplate
    ? concatImmutableLists(
        iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates),
        iGetLoadedCommonData(state, id, VMWizardProps.userTemplates),
      )
    : iGetLoadedCommonData(state, id, VMWizardProps.virtualMachines);

  return validateVmLikeEntityName(
    iGetFieldValue(field),
    iGetCommonData(state, id, VMWizardProps.activeNamespace),
    immutableListToShallowMetadataJS(entities),
    {
      existsErrorMessage: isCreateTemplate
        ? VIRTUAL_MACHINE_TEMPLATE_EXISTS
        : VIRTUAL_MACHINE_EXISTS,
      subject: getFieldTitle(iGetFieldKey(field)),
    },
  );
};

const validateUserTemplate: Validator = (field, options) => {
  const { getState, id } = options;
  const state = getState();

  const userTemplateName = iGetFieldValue(field);
  if (!userTemplateName) {
    return validateEmptyValue(userTemplateName, {
      subject: getFieldTitle(iGetFieldKey(field)),
    });
  }

  const userTemplatesList = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  if (!userTemplatesList) {
    return null;
  }

  const userTemplate = userTemplatesList.find(
    (template) => iGetName(template) === userTemplateName,
  );
  if (!userTemplate) {
    return asValidationObject(
      "Can't verify template, template is missing",
      ValidationErrorType.Error,
    );
  }

  return validateUserTemplateProvisionSource(userTemplate && userTemplate.toJSON());
};

export const validateOperatingSystem: Validator = (field) => {
  const os = iGetFieldValue(field);
  const guestFullName = iGet(field, 'guestFullName');

  if (os || !guestFullName) {
    return validateEmptyValue(os, {
      subject: getFieldTitle(iGetFieldKey(field)),
    });
  }

  return asValidationObject(`Select matching for: ${guestFullName}`, ValidationErrorType.Info);
};

const memoryValidation: Validator = (field, options): ValidationObject => {
  const memValue = iGetFieldValue(field);
  if (memValue == null || memValue === '' || BinaryUnit[memValue]) {
    return validateEmptyValue(memValue, {
      subject: getFieldTitle(iGetFieldKey(field)),
    });
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
    return asValidationObject('Memory must be specified at least in KiB units');
  }

  return null;
};

const asVMSettingsFieldValidator = (
  validator: (value: string, opts: { subject: string }) => ValidationObject,
) => (field) =>
  validator(iGetFieldValue(field), {
    subject: getFieldTitle(iGetFieldKey(field)),
  });

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
        ? [
            VMWizardProps.activeNamespace,
            VMWizardProps.userTemplates,
            VMWizardProps.commonTemplates,
          ]
        : [VMWizardProps.activeNamespace, VMWizardProps.virtualMachines];
    },
    validator: validateVm,
  },
  [VMSettingsField.USER_TEMPLATE]: {
    detectValueChanges: [VMSettingsField.USER_TEMPLATE],
    detectCommonDataChanges: [VMWizardProps.userTemplates],
    validator: validateUserTemplate,
  },
  [VMSettingsField.OPERATING_SYSTEM]: {
    detectValueChanges: [VMSettingsField.OPERATING_SYSTEM],
    validator: validateOperatingSystem,
  },
  [VMSettingsField.CPU]: {
    detectValueChanges: [VMSettingsField.CPU],
    validator: asVMSettingsFieldValidator(validatePositiveInteger),
  },
  [VMSettingsField.MEMORY]: {
    detectValueChanges: [
      VMSettingsField.MEMORY,
      VMSettingsField.OPERATING_SYSTEM,
      VMSettingsField.WORKLOAD_PROFILE,
    ],
    detectCommonDataChanges: [VMWizardProps.userTemplates, VMWizardProps.commonTemplates],
    validator: memoryValidation,
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
  const { hasAllRequiredFilled, isValid, error } = getFieldsValidity(vmSettings);

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.VM_SETTINGS,
      isValid,
      hasAllRequiredFilled,
      error,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.VM_SETTINGS,
        isValid,
        hasAllRequiredFilled,
        error,
      ),
    );
  }
};
