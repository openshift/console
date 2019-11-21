import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, Switch } from '@patternfly/react-core';
import { getFieldId } from './field-utils';
import { CheckboxFieldProps } from './field-types';

const SwitchField: React.FC<CheckboxFieldProps> = ({
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
      <Switch
        {...field}
        {...props}
        id={fieldId}
        label={label}
        isChecked={field.value}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value, event) => field.onChange(event)}
      />
    </FormGroup>
  );
};

export default SwitchField;
