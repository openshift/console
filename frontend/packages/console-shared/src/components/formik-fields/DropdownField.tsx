import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import classnames from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Dropdown } from '@console/internal/components/utils';
import { useFormikValidationFix } from '../../hooks';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const DropdownField: React.FC<DropdownFieldProps> = ({ label, helpText, required, ...props }) => {
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
      <Dropdown
        {...props}
        id={fieldId}
        selectedKey={field.value}
        dropDownClassName={classnames({ 'dropdown--full-width': props.fullWidth })}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(value: string) => {
          props.onChange && props.onChange(value);
          // Validation is automatically done by the useFormikValidationFix above
          setFieldValue(props.name, value, false);
          setFieldTouched(props.name, true, false);
        }}
      />
    </FormGroup>
  );
};

export default DropdownField;
