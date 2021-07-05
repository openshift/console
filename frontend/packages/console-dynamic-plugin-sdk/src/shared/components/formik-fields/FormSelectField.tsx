import * as React from 'react';
import { FormGroup, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { useFormikValidationFix } from '../../hooks';
import { FormSelectFieldOption, FormSelectFieldProps } from './field-types';
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

  // PF bug workaround
  // Return to field.value when fixed: https://github.com/patternfly/patternfly-react/issues/5687
  const hasSelectedOption: boolean = options.some(({ value }) => field.value === value);
  const placeholderOption: FormSelectFieldOption = options.find(
    ({ isPlaceholder }) => isPlaceholder,
  );
  const safeValue: string = hasSelectedOption
    ? field.value
    : placeholderOption
    ? placeholderOption.value
    : field.value;

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
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(value: any) => {
          props.onChange && props.onChange(value);
          // Validation is automatically done by the useFormikValidationFix above
          setFieldValue(props.name, value, false);
          setFieldTouched(props.name, true, false);
        }}
        value={safeValue}
      >
        {options.map((option) => (
          <FormSelectOption {...option} key={option.label} />
        ))}
      </FormSelect>
    </FormGroup>
  );
};

export default FormSelectField;
