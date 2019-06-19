/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, HelpBlock, Checkbox } from 'patternfly-react';
import { InputFieldProps } from './field-types';
import { getValidationState } from './field-utils';

const CheckboxField: React.FC<InputFieldProps> = ({ label, helpText, ...props }) => {
  const [field, { touched, error }] = useField(props.name);
  return (
    <FormGroup
      controlId={`${props.name}-field`}
      validationState={getValidationState(error, touched)}
    >
      <Checkbox
        {...field}
        {...props}
        checked={field.value}
        aria-describedby={helpText && `${props.name}-help`}
      >
        {label}
      </Checkbox>
      {helpText && <HelpBlock id={`${props.name}-help`}>{helpText}</HelpBlock>}
      {touched && error && <HelpBlock>{error}</HelpBlock>}
    </FormGroup>
  );
};

export default CheckboxField;
