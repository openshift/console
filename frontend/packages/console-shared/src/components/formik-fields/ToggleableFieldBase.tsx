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
  value,
  name,
  ...props
}) => {
  const [field, { touched, error }] = useField({ value, name, type: 'checkbox' });
  const fieldId = getFieldId(name, 'checkbox');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={formLabel}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      validated={(isValid) ? 'default' : 'error'}
      isRequired={required}
    >
      {children({
        ...field,
        ...props,
        value: field.value,
        id: fieldId,
        label,
        isChecked: field.checked,
        isValid,
        'aria-describedby': `${fieldId}-helper`,
        onChange: (val, event) => field.onChange(event),
      })}
    </FormGroup>
  );
};

export default ToggleableFieldBase;
