/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, Checkbox } from '@patternfly/react-core';
import { CheckboxFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  formLabel,
  helpText,
  required,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'checkbox');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={formLabel}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
    >
      <Checkbox
        {...field}
        {...props}
        id={fieldId}
        label={label}
        isChecked={field.value}
        isValid={isValid}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value, event) => field.onChange(event)}
      />
    </FormGroup>
  );
};

export default CheckboxField;
