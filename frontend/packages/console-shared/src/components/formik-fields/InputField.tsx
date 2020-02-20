import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { InputFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const InputField: React.FC<InputFieldProps> = ({
  label,
  helpText,
  required,
  onChange,
  validated,
  helpTextInvalid,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage || helpTextInvalid}
      validated={!isValid ? ValidatedOptions.error : validated}
      isRequired={required}
    >
      <TextInput
        {...field}
        {...props}
        id={fieldId}
        isRequired={required}
        validated={!isValid ? ValidatedOptions.error : validated}
        aria-describedby={`${fieldId}-helper`}
        value={field.value || ''}
        onChange={(value, event) => {
          field.onChange(event);
          onChange && onChange(event);
        }}
      />
    </FormGroup>
  );
};

export default InputField;
