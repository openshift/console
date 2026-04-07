import type { FC } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { FieldArray, useField } from 'formik';
import { useFormikValidationFix } from '../../../hooks/useFormikValidationFix';
import { getFieldId } from '../field-utils';
import MultiColumnFieldFooter from '../multi-column-field/MultiColumnFieldFooter';
import type { TextColumnFieldProps, TextColumnItemProps } from './text-column-types';
import TextColumnItem from './TextColumnItem';

const TextColumnField: FC<TextColumnFieldProps> = (props) => {
  const { required, name, label, addLabel, helpText, isReadOnly, onChange, children } = props;
  const [field, { touched, error }] = useField<string[]>(name);
  useFormikValidationFix(field.value);
  const rowValues = field.value ?? [];
  const fieldId = getFieldId(name, 'single-column');
  const isValid = !(touched && error);
  const getTextColumnProps = (colProps: TextColumnItemProps) => {
    return { ...colProps, key: `${colProps.idx.toString()}` };
  };

  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => (
        <>
          <FormGroup
            fieldId={fieldId}
            label={label}
            isRequired={required}
            data-test={props['data-test'] || 'text-column-field'}
          >
            {rowValues.map((v, idx) => {
              return (
                <TextColumnItem {...getTextColumnProps({ ...props, rowValues, idx, arrayHelpers })}>
                  {children}
                </TextColumnItem>
              );
            })}
            {!isReadOnly && (
              <MultiColumnFieldFooter
                addLabel={addLabel}
                onAdd={() => {
                  arrayHelpers.push('');
                  onChange && onChange([...rowValues, '']);
                }}
              />
            )}

            <FormHelperText>
              <HelperText>
                {!isValid ? (
                  <HelperTextItem>{error}</HelperTextItem>
                ) : (
                  <HelperTextItem>{helpText}</HelperTextItem>
                )}
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </>
      )}
    />
  );
};
export default TextColumnField;
