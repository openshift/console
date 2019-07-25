import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { RequestSizeInput } from '@console/internal/components/utils';
import { FormGroup } from '@patternfly/react-core';
import { ResourceLimitFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const ResourceLimitField: React.FC<ResourceLimitFieldProps> = ({
  label,
  unitName,
  helpText,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'resource-limit');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
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
          setFieldValue(props.name, _.toNumber(val.value));
          setFieldValue(unitName, val.unit);
          setFieldTouched(props.name, true);
        }}
        defaultRequestSizeValue={field.value}
        describedBy={`${fieldId}-helper`}
      />
    </FormGroup>
  );
};

export default ResourceLimitField;
