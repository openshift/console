import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  ValidatedOptions,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { useFormikValidationFix } from '../../hooks/formik-validation-fix';
import { BaseInputFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const BaseInputField: React.FC<
  BaseInputFieldProps & {
    children: (props) => React.ReactNode;
  }
> = ({
  label,
  helpText,
  required,
  children,
  name,
  onChange,
  onBlur,
  helpTextInvalid,
  validated,
  isReadOnly,
  ...props
}) => {
  const [field, { touched, error }] = useField({ name, type: 'input' });
  const fieldId = getFieldId(name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  useFormikValidationFix(field.value);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      {children({
        ...field,
        ...props,
        ...(isReadOnly !== undefined && { readOnly: isReadOnly }),
        value: field.value || '',
        id: fieldId,
        label,
        validated: !isValid ? ValidatedOptions.error : validated,
        'aria-describedby': helpText ? `${fieldId}-helper` : undefined,
        onChange: (event) => {
          field.onChange(event);
          onChange && onChange(event);
        },
        onBlur: (event) => {
          field.onBlur(event);
          onBlur && onBlur(event);
        },
      })}

      <FormHelperText id={`${fieldId}-helper`}>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error">{errorMessage || helpTextInvalid}</HelperTextItem>
          ) : (
            <HelperTextItem variant={validated}>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default BaseInputField;
