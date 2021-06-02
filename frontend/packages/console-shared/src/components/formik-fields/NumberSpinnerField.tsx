import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { NumberSpinner } from '@console/internal/components/utils';
import { useFormikValidationFix } from '../../hooks';
import { FieldProps } from './field-types';
import { getFieldId } from './field-utils';

const NumberSpinnerField: React.FC<FieldProps> = ({ label, helpText, required, ...props }) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'number-spinner');
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
      <NumberSpinner
        {...field}
        {...props}
        value={parseInt(field.value, 10)}
        id={fieldId}
        changeValueBy={(operation: number) => {
          setFieldValue(props.name, _.toInteger(field.value) + operation);
          setFieldTouched(props.name, true);
        }}
        aria-describedby={`${fieldId}-helper`}
      />
    </FormGroup>
  );
};

export default NumberSpinnerField;
