import * as React from 'react';
import { Radio } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { RadioButtonFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const RadioButtonField: React.FC<RadioButtonFieldProps> = ({
  name,
  label,
  value,
  onChange,
  isChecked,
  ...props
}) => {
  const [field, { touched, error }] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(`${name}-${value}`, 'radiobutton');
  const isValid = !(touched && error);
  return (
    <Radio
      {...field}
      {...props}
      id={fieldId}
      value={value}
      label={label}
      isChecked={isChecked || field.value === value}
      isValid={isValid}
      isDisabled={props.isDisabled}
      aria-label={`${fieldId}-${label}`}
      data-test={`${value}-view-input`}
      onChange={() => {
        if (onChange) {
          onChange(value);
        } else {
          setFieldValue(name, value);
        }
        setFieldTouched(name, true);
      }}
    />
  );
};

export default RadioButtonField;
