import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import MonacoEditor, { ChangeHandler, MonacoEditorProps } from 'react-monaco-editor';
import { RedExclamationCircleIcon, useDebounceCallback } from '@console/shared/src';
import '@console/shared/src/components/editor/theme';

type EditorFieldProps = {
  name: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  required?: boolean;
  isDisabled?: boolean;
} & MonacoEditorProps;

const EditorField: React.FC<EditorFieldProps> = ({
  name,
  label,
  helpText,
  required,
  isDisabled,
  onChange,
  ...otherProps
}) => {
  const { getFieldMeta, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const { error, value } = getFieldMeta<string>(name);

  const debouncedOnChange = useDebounceCallback<ChangeHandler>((newValue, event) => {
    if (onChange) {
      onChange(newValue, event);
    }
    setFieldValue(name, newValue, false);
    setFieldTouched(name, true);
  }, 100);

  return (
    <FormGroup fieldId="" label={label} isRequired={required}>
      <MonacoEditor {...otherProps} value={value} onChange={debouncedOnChange} />

      <FormHelperText>
        <HelperText>
          {error ? (
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />} />
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default EditorField;
