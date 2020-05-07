import * as React from 'react';
import * as _ from 'lodash';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import { FormGroup, gridItemSpanValueShape } from '@patternfly/react-core';
import { SecondaryStatus, useFormikValidationFix } from '@console/shared';
import { MultiColumnFieldProps } from '../field-types';
import MultiColumnFieldHeader from './MultiColumnFieldHeader';
import MultiColumnFieldRow from './MultiColumnFieldRow';
import MultiColumnFieldFooter from './MultiColumnFieldFooter';
import { getSpans } from './multicolumn-field-utils';
import './MultiColumnField.scss';

const MultiColumnField: React.FC<MultiColumnFieldProps> = ({
  children,
  name,
  label,
  helpText,
  required,
  addLabel,
  headers,
  emptyValues,
  emptyMessage,
  isReadOnly,
  disableDeleteRow,
  disableAddRow,
  toolTip,
  spans,
}) => {
  const { values } = useFormikContext<FormikValues>();
  const fieldValue = _.get(values, name, []);
  const totalFieldCount: gridItemSpanValueShape = React.Children.count(
    children,
  ) as gridItemSpanValueShape;
  const fieldSpans = spans || getSpans(totalFieldCount);
  useFormikValidationFix(fieldValue);
  return (
    <FieldArray
      name={name}
      render={({ push, remove }) => {
        return (
          <FormGroup
            fieldId={`form-multi-column-input-${name.replace(/\./g, '-')}-field`}
            label={label}
            helperText={helpText}
            isRequired={required}
          >
            {fieldValue.length < 1 ? (
              emptyMessage && (
                <div className="odc-multi-column-field__empty-message">
                  <SecondaryStatus status={emptyMessage} />
                </div>
              )
            ) : (
              <MultiColumnFieldHeader headers={headers} spans={fieldSpans} />
            )}
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
                  spans={fieldSpans}
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
};

export default MultiColumnField;
