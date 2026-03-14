import type { ReactNode, FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import type { BasicCodeEditorProps } from '@console/dynamic-plugin-sdk';
import { RedExclamationCircleIcon } from '@console/shared/src';
import { BasicCodeEditor } from '@console/shared/src/components/editor/BasicCodeEditor';
import { useDebounceCallback } from '@console/shared/src/hooks/useDebounceCallback';

type EditorFieldProps = Partial<BasicCodeEditorProps> & {
  name: string;
  label?: ReactNode;
  helpText?: ReactNode;
  required?: boolean;
  isDisabled?: boolean;
};

const EditorField: FC<EditorFieldProps> = ({
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

  const debouncedOnChange = useDebounceCallback((newValue, event) => {
    if (onChange) {
      onChange(newValue, event);
    }
    setFieldValue(name, newValue, false);
    setFieldTouched(name, true);
  }, 100);

  return (
    <FormGroup fieldId="" label={label} isRequired={required}>
      <BasicCodeEditor
        isMinimapVisible={false}
        height="sizeToFit"
        isFullHeight={false}
        {...otherProps}
        code={value}
        onChange={debouncedOnChange}
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
