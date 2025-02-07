import * as React from 'react';
import { CodeEditor, ChangeHandler, Language } from '@patternfly/react-code-editor';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { RedExclamationCircleIcon, useDebounceCallback } from '@console/shared/src';
import { useConsoleMonacoTheme } from '@console/shared/src/components/editor/theme';

type EditorFieldProps = {
  name: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  required?: boolean;
  isDisabled?: boolean;
  onChange?: ChangeHandler;
  language?: Language;
  options?: Monaco.editor.IEditorOptions;
};

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
  const [monaco, setMonaco] = React.useState<typeof Monaco | null>(null);
  useConsoleMonacoTheme(monaco?.editor);

  const debouncedOnChange = useDebounceCallback<ChangeHandler>((newValue, event) => {
    if (onChange) {
      onChange(newValue, event);
    }
    setFieldValue(name, newValue, false);
    setFieldTouched(name, true);
  }, 100);

  return (
    <FormGroup fieldId="" label={label} isRequired={required}>
      <CodeEditor
        value={value}
        onChange={debouncedOnChange}
        onEditorDidMount={(_e, m) => setMonaco(m)}
        isReadOnly={false}
        isMinimapVisible={false}
        height="sizeToFit"
        language={otherProps?.language}
        options={otherProps?.options}
      />

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
