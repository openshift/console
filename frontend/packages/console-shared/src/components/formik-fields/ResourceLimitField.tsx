import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { RequestSizeInput } from '@console/internal/components/utils';
import { useFormikValidationFix } from '../../hooks';
import { RedExclamationCircleIcon } from '../status';
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
    <FormGroup fieldId={fieldId} label={label} isRequired={props.required}>
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

export default ResourceLimitField;
