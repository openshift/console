import { forwardRef } from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
} from '@patternfly/react-core';
import { useField } from 'formik';
import type { TextAreaProps } from './field-types';
import { getFieldId } from './field-utils';

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, helpText, required, onChange, ...props }, ref) => {
    const [field, { touched, error }] = useField(props.name);
    const fieldId = getFieldId(props.name, 'input');
    const isValid = !(touched && error);
    const errorMessage = !isValid ? error : '';

    return (
      <FormGroup fieldId={fieldId} label={label} isRequired={required}>
        <TextArea
          {...field}
          {...props}
          ref={ref}
          id={fieldId}
          style={{ resize: 'vertical' }}
          validated={isValid ? 'default' : 'error'}
          isRequired={required}
          aria-describedby={helpText ? `${fieldId}-helper` : undefined}
          onChange={(event, value) => {
            onChange && onChange(value);
            field.onChange(event);
          }}
        />

        <FormHelperText>
          <HelperText>
            {!isValid ? (
              <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
            ) : (
              <HelperTextItem>{helpText}</HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
    );
  },
);

export default TextAreaField;
