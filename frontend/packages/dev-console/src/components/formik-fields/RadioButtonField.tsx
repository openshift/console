import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, Radio } from '@patternfly/react-core';
import { RadioButtonProps } from './field-types';
import { getFieldId } from './field-utils';

const RadioButtonField: React.FC<RadioButtonProps> = ({
  label,
  value,
  checked,
  helpText,
  required,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(value, 'radiobutton');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
    >
      <Radio
        {...field}
        {...props}
        id={fieldId}
        value={value}
        label={label}
        isChecked={checked}
        isValid={isValid}
        aria-describedby={`${fieldId}-helper`}
        onChange={(val, event) => field.onChange(event)}
      />
    </FormGroup>
  );
};

export default RadioButtonField;
