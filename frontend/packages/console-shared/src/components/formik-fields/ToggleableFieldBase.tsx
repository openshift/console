import * as React from 'react';
import { useField } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { CheckboxFieldProps } from './field-types';
import { getFieldId } from './field-utils';

type ToggleableFieldBaseProps = CheckboxFieldProps & {
  children: (props) => React.ReactNode;
};

const ToggleableFieldBase: React.FC<ToggleableFieldBaseProps> = ({
  label,
  formLabel,
  helpText,
  required,
  children,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'checkbox');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={formLabel}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
    >
      {children({
        ...field,
        ...props,
        id: fieldId,
        label,
        isChecked: field.value,
        isValid,
        'aria-describedby': `${fieldId}-helper`,
        onChange: (value, event) => field.onChange(event),
      })}
    </FormGroup>
  );
};

export default ToggleableFieldBase;
