import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Dropdown } from '@console/internal/components/utils';
import { FormGroup } from '@patternfly/react-core';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import { useFormikValidationFix } from '../../hooks';

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
      validated={(isValid) ? 'default' : 'error'}
      isRequired={required}
    >
      <Dropdown
        {...props}
        id={fieldId}
        selectedKey={field.value}
        dropDownClassName={cx({ 'dropdown--full-width': props.fullWidth })}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value: string) => {
          props.onChange && props.onChange(value);
          setFieldValue(props.name, value);
          setFieldTouched(props.name, true);
        }}
      />
    </FormGroup>
  );
};

export default DropdownField;
