import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { NsDropdown } from '@console/internal/components/utils/list-dropdown';
import { useFormikValidationFix } from '../../hooks/formik-validation-fix';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const NSDropdownField: FC<DropdownFieldProps> = ({
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

  useFormikValidationFix(field.value);

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <NsDropdown
        {...props}
        id={fieldId}
        selectedKey={field.value}
        onChange={(value: string) => {
          setFieldValue(props.name, value);
          setFieldTouched(props.name, true);
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

export default NSDropdownField;
