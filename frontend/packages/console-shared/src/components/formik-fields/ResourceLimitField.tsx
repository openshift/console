import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { RequestSizeInput } from '@console/internal/components/utils';
import { FormGroup } from '@patternfly/react-core';
import { ResourceLimitFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import { useFormikValidationFix } from '../../hooks';

const ResourceLimitField: React.FC<ResourceLimitFieldProps> = ({
  label,
  unitName,
  unitOptions,
  defaultUnitSize,
  helpText,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
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
      isValid={isValid}
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
        defaultRequestSizeUnit={defaultUnitSize}
        defaultRequestSizeValue={field.value}
        describedBy={`${fieldId}-helper`}
      />
    </FormGroup>
  );
};

export default ResourceLimitField;
