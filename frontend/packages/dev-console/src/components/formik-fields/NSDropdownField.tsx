import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { NsDropdown } from '@console/internal/components/utils';
import { FormGroup } from '@patternfly/react-core';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const NSDropdownField: React.FC<DropdownFieldProps> = ({
  label,
  helpText,
  required,
  fullWidth,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'ns-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
    >
      <NsDropdown
        {...props}
        id={fieldId}
        selectedKey={field.value}
        onChange={(value: string) => {
          setFieldValue(props.name, value);
          setFieldTouched(props.name, true);
        }}
      />
    </FormGroup>
  );
};

export default NSDropdownField;
