import * as React from 'react';
import * as classNames from 'classnames';
import { useField } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { RadioGroupFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import RadioButtonField from './RadioButtonField';
import './RadioGroupField.scss';

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  options,
  helpText,
  required,
  inline,
  onChange,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'radiogroup');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      className={classNames('ocs-radio-group-field', { 'ocs-radio-group-field--inline': inline })}
      fieldId={fieldId}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
      label={label}
    >
      {options.map((option) => {
        const activeChild = field.value === option.value && option.activeChildren;
        const staticChild = option.children;

        const description = (activeChild || staticChild) && (
          <div className="ocs-radio-group-field__children">
            {staticChild}
            {activeChild}
          </div>
        );

        return (
          <React.Fragment key={option.value}>
            <RadioButtonField
              {...field}
              {...props}
              value={option.value}
              label={option.label}
              isDisabled={option.isDisabled}
              aria-describedby={`${fieldId}-helper`}
              description={description}
              onChange={onChange}
            />
          </React.Fragment>
        );
      })}
    </FormGroup>
  );
};

export default RadioGroupField;
