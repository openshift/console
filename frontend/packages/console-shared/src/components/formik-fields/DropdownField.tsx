import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { useFormikValidationFix } from '../../hooks/formik-validation-fix';
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
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <ConsoleSelect
        {...props}
        items={props.items}
        id={fieldId}
        selectedKey={field.value}
        isFullWidth={props.fullWidth}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(value: string) => {
          props.onChange && props.onChange(value);
          // Validation is automatically done by the useFormikValidationFix above
          setFieldValue(props.name, value, false);
          setFieldTouched(props.name, true, false);
        }}
      />

      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default DropdownField;
