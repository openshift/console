import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, TextArea } from '@patternfly/react-core';
import { TextAreaProps } from './field-types';
import { getFieldId } from './field-utils';

const TextAreaField: React.FC<TextAreaProps> = ({ label, helpText, required, ...props }) => {
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
      validated={(isValid) ? 'default' : 'error'}
      isRequired={required}
    >
      <TextArea
        {...field}
        {...props}
        id={fieldId}
        style={{ resize: 'vertical' }}
        validated={(isValid) ? 'default' : 'error'}
        isRequired={required}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value, event) => field.onChange(event)}
      />
    </FormGroup>
  );
};

export default TextAreaField;
