import * as React from 'react';
import { FieldArray, useField } from 'formik';
import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { useFormikValidationFix } from '@console/shared';
import MultiColumnFieldFooter from '../multi-column-field/MultiColumnFieldFooter';
import { getFieldId } from '../field-utils';
import TextColumnItem from './TextColumnItem';
import TextColumnItemWithDnd from './TextColumnItemWithDnd';
import { TextColumnFieldProps, TextColumnItemProps } from './text-column-types';
import DragAndDrop from './DragAndDrop';

const TextColumnField: React.FC<TextColumnFieldProps> = (props) => {
  const {
    required,
    name,
    label,
    addLabel,
    helpText,
    isReadOnly,
    onChange,
    children,
    dndEnabled = false,
  } = props;
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
            validated={isValid ? ValidatedOptions.default : ValidatedOptions.error}
            isRequired={required}
            data-test={props['data-test'] || 'text-column-field'}
          >
            {helpText && <div className="pf-c-form__helper-text">{helpText}</div>}
            {dndEnabled ? (
              <DragAndDrop>
                {rowValues.map((v, idx) => {
                  return (
                    <TextColumnItemWithDnd
                      {...getTextColumnProps({ ...props, rowValues, idx, arrayHelpers })}
                    >
                      {children}
                    </TextColumnItemWithDnd>
                  );
                })}
              </DragAndDrop>
            ) : (
              <>
                {rowValues.map((v, idx) => {
                  return (
                    <TextColumnItem
                      {...getTextColumnProps({ ...props, rowValues, idx, arrayHelpers })}
                    >
                      {children}
                    </TextColumnItem>
                  );
                })}
              </>
            )}
            {!isReadOnly && (
              <MultiColumnFieldFooter
                addLabel={addLabel}
                onAdd={() => {
                  arrayHelpers.push('');
                  onChange && onChange([...rowValues, '']);
                }}
              />
            )}
          </FormGroup>
        </>
      )}
    />
  );
};
export default TextColumnField;
