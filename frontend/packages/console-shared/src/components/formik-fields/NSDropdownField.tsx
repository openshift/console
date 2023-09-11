import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { NsDropdown } from '@console/internal/components/utils';
import { useFormikValidationFix } from '../../hooks';
import { RedExclamationCircleIcon } from '../status';
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
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {errorMessage}
            </HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default NSDropdownField;
