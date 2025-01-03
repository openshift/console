import * as React from 'react';
import Editor, { OnChange, EditorProps, Monaco } from '@monaco-editor/react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { RedExclamationCircleIcon, useDebounceCallback } from '@console/shared/src';
import { useConsoleMonacoTheme } from '@console/shared/src/components/editor/theme';

type EditorFieldProps = {
  name: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  required?: boolean;
  isDisabled?: boolean;
} & EditorProps;

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
  const [monaco, setMonaco] = React.useState<Monaco | null>(null);
  useConsoleMonacoTheme(monaco?.editor);

  const debouncedOnChange = useDebounceCallback<OnChange>((newValue, event) => {
    if (onChange) {
      onChange(newValue, event);
    }
    setFieldValue(name, newValue, false);
    setFieldTouched(name, true);
  }, 100);

  return (
    <FormGroup fieldId="" label={label} isRequired={required}>
      <Editor
        {...otherProps}
        value={value}
        onChange={debouncedOnChange}
        onMount={(_e, m) => {
          setMonaco(m);
        }}
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
