import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, Radio } from '@patternfly/react-core';
import { RadioButtonProps } from './field-types';
import { getFieldId } from './field-utils';
import './RadioButtonField.scss';

const RadioButtonField: React.FC<RadioButtonProps> = ({
  label,
  options,
  helpText,
  required,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'radiobutton');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
      label={label}
    >
      {options.map((option) => (
        <>
          <Radio
            {...field}
            {...props}
            key={option.value}
            id={getFieldId(option.value, 'radiobutton')}
            value={option.value}
            label={
              option.helperText ? (
                <>
                  {option.label}
                  <div className="odc-radio-button__helper-text">{option.helperText}</div>
                </>
              ) : (
                option.label
              )
            }
            isChecked={field.value === option.value}
            isValid={isValid}
            aria-describedby={`${fieldId}-helper`}
            onChange={(val, event) => {
              field.onChange(event);
            }}
          />
          <br />
          {option.displayField && field.value === option.value ? (
            <>
              {option.displayField}
              <br />
            </>
          ) : null}
        </>
      ))}
    </FormGroup>
  );
};

export default RadioButtonField;
