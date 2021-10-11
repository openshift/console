import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import MonacoEditor, { ChangeHandler, MonacoEditorProps } from 'react-monaco-editor';
import { useDebounceCallback } from '@console/shared/src';
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
    <FormGroup
      fieldId=""
      label={label}
      helperText={helpText}
      validated={error ? 'error' : 'default'}
      isRequired={required}
    >
      <MonacoEditor {...otherProps} value={value} onChange={debouncedOnChange} />
    </FormGroup>
  );
};

export default EditorField;
