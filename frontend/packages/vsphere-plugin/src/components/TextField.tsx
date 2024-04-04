import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  TextInputProps,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useField } from 'formik';

interface TextFieldProps extends TextInputProps {
  name: string;
  helperText?: React.ReactNode;
}

const TextField = React.forwardRef(
  (
    { helperText, onChange: onParentChange, ...props }: TextFieldProps,
    ref: React.Ref<HTMLInputElement>,
  ) => {
    const [field, meta, { setValue }] = useField({
      name: props.name,
    });

    const onChange = (_ev, value: string) => {
      setValue(value);
      onParentChange?.(_ev, value);
    };

    const fieldId = `textfield-${props.name}`;
    const hasError = meta.touched && !!meta.error;

    return (
      <FormGroup id={`form-control__${fieldId}`} fieldId={fieldId}>
        <TextInput
          {...field}
          {...props}
          ref={ref}
          id={fieldId}
          onChange={onChange}
          validated={hasError ? 'error' : 'default'}
        />

        {helperText && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant={'default'}>{helperText}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
        {hasError && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={'error'}>
                {meta.error}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
