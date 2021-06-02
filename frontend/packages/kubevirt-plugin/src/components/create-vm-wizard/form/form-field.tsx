import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { inject } from '@console/internal/components/utils';
import { ValidationErrorType } from '@console/shared';
import { iGetIn } from '../../../utils/immutable';
import {
  iGetFieldKey,
  iGetFieldValue,
  isFieldDisabled,
  isFieldRequired,
} from '../selectors/immutable/field';
import { VMSettingsField } from '../types';
import { getFieldId, getFieldTitleKey, getPlaceholderKey } from '../utils/renderable-field-utils';
import { FormFieldContext } from './form-field-context';

export enum FormFieldType {
  TEXT = 'TEXT',
  TEXT_AREA = 'TEXT_AREA',
  SELECT = 'SELECT',
  PF_SELECT = 'PF_SELECT',
  CHECKBOX = 'CHECKBOX',
  INLINE_CHECKBOX = 'INLINE_CHECKBOX',
  FILE_UPLOAD = 'FILE_UPLOAD',
  CUSTOM = 'CUSTOM',
  DROPDOWN = 'DROPDOWN',
}

const hasValue = new Set([
  FormFieldType.TEXT,
  FormFieldType.TEXT_AREA,
  FormFieldType.SELECT,
  FormFieldType.FILE_UPLOAD,
]);
const hasIsDisabled = new Set([
  FormFieldType.TEXT,
  FormFieldType.SELECT,
  FormFieldType.CHECKBOX,
  FormFieldType.INLINE_CHECKBOX,
  FormFieldType.FILE_UPLOAD,
  FormFieldType.CUSTOM,
  FormFieldType.PF_SELECT,
]);
const hasDisabled = new Set([FormFieldType.TEXT_AREA, FormFieldType.DROPDOWN]);
const hasIsChecked = new Set([FormFieldType.CHECKBOX, FormFieldType.INLINE_CHECKBOX]);
const hasValidated = new Set([
  FormFieldType.TEXT,
  FormFieldType.TEXT_AREA,
  FormFieldType.SELECT,
  FormFieldType.FILE_UPLOAD,
]);
const hasIsValid = new Set([
  FormFieldType.CHECKBOX,
  FormFieldType.INLINE_CHECKBOX,
  FormFieldType.CUSTOM,
]);
const hasIsRequired = new Set([
  FormFieldType.TEXT,
  FormFieldType.TEXT_AREA,
  FormFieldType.SELECT,
  FormFieldType.FILE_UPLOAD,
  FormFieldType.CUSTOM,
]);
const hasLabel = new Set([FormFieldType.INLINE_CHECKBOX]);
const hasSelections = new Set([FormFieldType.PF_SELECT]);
const hasPlaceholderText = new Set([FormFieldType.PF_SELECT]);
const hasToggleId = new Set([FormFieldType.PF_SELECT]);
const validatedValidationErrorTypes = new Set([
  ValidationErrorType.Error,
  ValidationErrorType.Warn,
]);

const setSupported = (fieldType: FormFieldType, supportedTypes: Set<FormFieldType>, value) =>
  supportedTypes.has(fieldType) ? value : undefined;

// renders only when props change (shallow compare)
export const FormField: React.FC<FormFieldProps> = ({
  children,
  isDisabled,
  value,
  isCreateTemplate,
}) => {
  const { t } = useTranslation();
  return (
    <FormFieldContext.Consumer>
      {({
        field,
        fieldType,
        isLoading,
      }: {
        field: any;
        fieldType: FormFieldType;
        isLoading: boolean;
      }) => {
        const set = setSupported.bind(undefined, fieldType);
        const val = value || iGetFieldValue(field);
        const key = iGetFieldKey(field);
        const disabled = isDisabled || isFieldDisabled(field) || isLoading;
        const validationType = iGetIn(field, ['validation', 'type']);
        const isValid = validationType !== ValidationErrorType.Error;
        const validated = validatedValidationErrorTypes.has(validationType)
          ? validationType
          : undefined;

        return inject(
          children,
          _.omitBy(
            {
              value: hasValue.has(fieldType) ? val || t(getPlaceholderKey(key)) || '' : undefined,
              isChecked: set(hasIsChecked, val),
              isDisabled: set(hasIsDisabled, disabled),
              disabled: set(hasDisabled, disabled),
              isRequired: set(hasIsRequired, isFieldRequired(field)),
              isValid: set(hasIsValid, isValid),
              validated: set(hasValidated, validated),
              id: getFieldId(key),
              label: set(
                hasLabel,
                t(
                  isCreateTemplate
                    ? getFieldTitleKey(VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE_TEMPLATE)
                    : getFieldTitleKey(key),
                ),
              ),
              selections: set(hasSelections, val),
              placeholderText: set(hasPlaceholderText, t(getPlaceholderKey(key))),
              toggleId: set(hasToggleId, getFieldId(key)),
            },
            _.isUndefined,
          ),
        );
      }}
    </FormFieldContext.Consumer>
  );
};

type FormFieldProps = {
  children: React.ReactNode;
  isDisabled?: boolean;
  value?: any;
  isCreateTemplate?: boolean;
};
