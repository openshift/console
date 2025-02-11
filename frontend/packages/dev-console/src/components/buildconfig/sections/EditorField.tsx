import * as React from 'react';
import { ChangeHandler, Language } from '@patternfly/react-code-editor';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { RedExclamationCircleIcon, useDebounceCallback } from '@console/shared/src';
import { BasicCodeEditor } from '@console/shared/src/components/editor/BasicCodeEditor';

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

  const debouncedOnChange = useDebounceCallback<ChangeHandler>((newValue, event) => {
    if (onChange) {
      onChange(newValue, event);
    }
    setFieldValue(name, newValue, false);
    setFieldTouched(name, true);
  }, 100);

  return (
    <FormGroup fieldId="" label={label} isRequired={required}>
      <BasicCodeEditor
        code={value}
        onChange={debouncedOnChange}
        isFullHeight={false}
        height="sizeToFit"
        language={otherProps?.language}
        options={{
          minimap: { enabled: false },
          ...otherProps?.options,
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
