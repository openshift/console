import * as React from 'react';
import cx from 'classnames';
import { useField } from 'formik';
import { FormGroup, ControlLabel, FormControl, HelpBlock } from 'patternfly-react';
import { InputFieldProps } from './field-types';
import { getValidationState } from './field-utils';

const InputField: React.FC<InputFieldProps> = ({ label, helpText, ...props }) => {
  const [field, { touched, error }] = useField(props.name);
  return (
    <FormGroup
      controlId={`form-input-${props.name.replace(/\./g, '-')}-field`}
      name={`${props.name}-field`}
      validationState={getValidationState(error, touched)}
    >
      {label && (
        <ControlLabel className={cx({ 'co-required': props.required })}>{label}</ControlLabel>
      )}
      <FormControl {...field} {...props} aria-describedby={helpText && `${props.name}-help`} />
      {helpText && <HelpBlock id={`${props.name}-help`}>{helpText}</HelpBlock>}
      {touched && error && <HelpBlock>{error}</HelpBlock>}
    </FormGroup>
  );
};

export default InputField;
