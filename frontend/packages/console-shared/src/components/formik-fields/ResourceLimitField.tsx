import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { RequestSizeInput } from '@console/internal/components/utils';
import { useFormikValidationFix } from '../../hooks';
import { ResourceLimitFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const ResourceLimitField: React.FC<ResourceLimitFieldProps> = ({
  label,
  unitName,
  unitOptions,
  helpText,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const [fieldUnit] = useField(unitName);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'resource-limit');
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
      isRequired={props.required}
    >
      <RequestSizeInput
        {...props}
        onChange={(val) => {
          setFieldValue(props.name, val.value);
          setFieldTouched(props.name, true);
          setFieldValue(unitName, val.unit);
        }}
        dropdownUnits={unitOptions}
        defaultRequestSizeUnit={fieldUnit.value}
        defaultRequestSizeValue={field.value}
        describedBy={`${fieldId}-helper`}
      />
    </FormGroup>
  );
};

export default ResourceLimitField;
