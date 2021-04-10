import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useFormikValidationFix } from '../../hooks';
import { FormSelectFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const FormSelectField: React.FC<FormSelectFieldProps> = ({
  label,
  helpText,
  required,
  options,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      validated={isValid ? 'default' : 'error'}
      isRequired={required}
    >
      <FormSelect
        {...props}
        id={fieldId}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value: any) => {
          props.onChange && props.onChange(value);
          // Validation is automatically done by the useFormikValidationFix above
          setFieldValue(props.name, value, false);
          setFieldTouched(props.name, true, false);
        }}
        value={field.value}
      >
        {options.map((option) => (
          <FormSelectOption {...option} key={option.label} />
        ))}
      </FormSelect>
    </FormGroup>
  );
};

export default FormSelectField;
