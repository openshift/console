import * as React from 'react';
import { FormGroup, TextArea } from '@patternfly/react-core';
import { useField } from 'formik';
import { TextAreaProps } from './field-types';
import { getFieldId } from './field-utils';

const TextAreaField: React.FC<TextAreaProps> = (
  { label, helpText, required, onChange, ...props },
  ref,
) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      validated={isValid ? 'default' : 'error'}
      isRequired={required}
    >
      <TextArea
        {...field}
        {...props}
        ref={ref}
        id={fieldId}
        style={{ resize: 'vertical' }}
        validated={isValid ? 'default' : 'error'}
        isRequired={required}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        onChange={(value, event) => {
          onChange && onChange(value);
          field.onChange(event);
        }}
      />
    </FormGroup>
  );
};

export default React.forwardRef(TextAreaField);
