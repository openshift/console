import * as React from 'react';
import * as _ from 'lodash';
import { FieldArray } from 'formik';
import { FormGroup } from '@patternfly/react-core';
import { MultiColumnFieldProps } from '../field-types';
import MultiColumnFieldHeader from './MultiColumnFieldHeader';
import MultiColumnFieldRow from './MultiColumnFieldRow';
import MultiColumnFieldFooter from './MultiColumnFieldFooter';

const MultiColumnField: React.FC<MultiColumnFieldProps> = ({
  children,
  name,
  label,
  helpText,
  required,
  addLabel,
  headers,
  emptyValues,
  isReadOnly,
  disableDeleteRow,
  disableAddRow,
  toolTip,
}) => (
  <FieldArray
    name={name}
    render={({ push, remove, form }) => {
      const fieldValue = _.get(form.values, name, []);
      return (
        <FormGroup
          fieldId={`form-multi-column-input-${name.replace(/\./g, '-')}-field`}
          label={label}
          helperText={helpText}
          isRequired={required}
        >
          <MultiColumnFieldHeader headers={headers} />
          {fieldValue.length > 0 &&
            fieldValue.map((value, index) => (
              <MultiColumnFieldRow
                key={`${index.toString()}`} // There is no other usable value for key prop in this case.
                name={name}
                toolTip={toolTip}
                rowIndex={index}
                onDelete={() => remove(index)}
                isReadOnly={isReadOnly}
                disableDeleteRow={disableDeleteRow}
              >
                {children}
              </MultiColumnFieldRow>
            ))}
          {!isReadOnly && (
            <MultiColumnFieldFooter
              disableAddRow={disableAddRow}
              addLabel={addLabel}
              onAdd={() => push(emptyValues)}
            />
          )}
        </FormGroup>
      );
    }}
  />
);

export default MultiColumnField;
