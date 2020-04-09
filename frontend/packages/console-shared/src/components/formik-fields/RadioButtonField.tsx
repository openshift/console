import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Radio } from '@patternfly/react-core';
import { RadioButtonFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const RadioButtonField: React.FC<RadioButtonFieldProps> = ({ name, label, value, ...props }) => {
  const [field, { touched, error }] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(`${name}-${value}`, 'radiobutton');
  const isValid = !(touched && error);
  return (
    <Radio
      {...field}
      {...props}
      id={fieldId}
      value={value}
      label={label}
      isChecked={field.value === value}
      isValid={isValid}
      isDisabled={props.isDisabled}
      aria-label={`${fieldId}-${label}`}
      onChange={() => setFieldValue(name, value)}
    />
  );
};

export default RadioButtonField;
