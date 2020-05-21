import * as React from 'react';
import * as _ from 'lodash';
import { inject } from '@console/internal/components/utils';
import { ValidationErrorType } from '@console/shared';
import { getPlaceholder, getFieldId, getFieldTitle } from '../utils/renderable-field-utils';
import { iGetIn } from '../../../utils/immutable';
import {
  iGetFieldKey,
  iGetFieldValue,
  isFieldDisabled,
  isFieldRequired,
} from '../selectors/immutable/field';
import { FormFieldContext } from './form-field-context';

export enum FormFieldType {
  TEXT = 'TEXT',
  TEXT_AREA = 'TEXT_AREA',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  INLINE_CHECKBOX = 'INLINE_CHECKBOX',
  FILE_UPLOAD = 'FILE_UPLOAD',
  CUSTOM = 'CUSTOM',
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
]);
const hasDisabled = new Set([FormFieldType.TEXT_AREA]);
const hasIsChecked = new Set([FormFieldType.CHECKBOX, FormFieldType.INLINE_CHECKBOX]);
const hasValidated = new Set([FormFieldType.FILE_UPLOAD]);
const hasIsValid = new Set([
  FormFieldType.TEXT,
  FormFieldType.TEXT_AREA,
  FormFieldType.SELECT,
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

const setSupported = (fieldType: FormFieldType, supportedTypes: Set<FormFieldType>, value) =>
  supportedTypes.has(fieldType) ? value : undefined;

// renders only when props change (shallow compare)
export const FormField: React.FC<FormFieldProps> = ({ children, isDisabled, value }) => {
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
        const isValid = iGetIn(field, ['validation', 'type']) !== ValidationErrorType.Error;

        return inject(
          children,
          _.omitBy(
            {
              value: hasValue.has(fieldType) ? val || getPlaceholder(key) || '' : undefined,
              isChecked: set(hasIsChecked, val),
              isDisabled: set(hasIsDisabled, disabled),
              disabled: set(hasDisabled, disabled),
              isRequired: set(hasIsRequired, isFieldRequired(field)),
              isValid: set(hasIsValid, isValid),
              validated: set(hasValidated, isValid ? undefined : 'error'),
              id: getFieldId(key),
              label: set(hasLabel, getFieldTitle(key)),
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
};
