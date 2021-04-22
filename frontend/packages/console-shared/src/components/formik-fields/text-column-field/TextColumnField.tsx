import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { FieldArray, useField } from 'formik';
import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { useFormikValidationFix } from '@console/shared';
import MultiColumnFieldFooter from '../multi-column-field/MultiColumnFieldFooter';
import { getFieldId } from '../field-utils';
import TextColumnItem from './TextColumnItem';
import { TextColumnFieldProps } from './text-column-types';

const TextColumnField: React.FC<TextColumnFieldProps> = (props) => {
  const { required, name, label, addLabel, helpText, isReadOnly, onChange, children } = props;
  const [field, { touched, error }] = useField<string[]>(name);
  useFormikValidationFix(field.value);
  const rowValues = field.value ?? [];
  const fieldId = getFieldId(name, 'single-column');
  const isValid = !(touched && error);
  return (
    <FieldArray
      name={name}
      render={(arrayHelpers) => (
        <>
          <DndProvider backend={HTML5Backend}>
            <FormGroup
              fieldId={fieldId}
              label={label}
              validated={isValid ? ValidatedOptions.default : ValidatedOptions.error}
              isRequired={required}
              helperText={helpText}
            >
              {rowValues.map((v, idx) => {
                return (
                  <TextColumnItem
                    {...props}
                    key={`${idx.toString()}`}
                    idx={idx}
                    arrayHelpers={arrayHelpers}
                    rowValues={rowValues}
                  >
                    {children}
                  </TextColumnItem>
                );
              })}
            </FormGroup>
          </DndProvider>
          {!isReadOnly && (
            <MultiColumnFieldFooter
              addLabel={addLabel}
              onAdd={() => {
                arrayHelpers.push('');
                onChange && onChange([...rowValues, '']);
              }}
            />
          )}
        </>
      )}
    />
  );
};

export default TextColumnField;
