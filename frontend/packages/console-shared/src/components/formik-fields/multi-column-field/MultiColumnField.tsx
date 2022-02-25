import * as React from 'react';
import { FormGroup, gridItemSpanValueShape } from '@patternfly/react-core';
import { FieldArray, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useFormikValidationFix } from '../../../hooks/formik-validation-fix';
import SecondaryStatus from '../../status/SecondaryStatus';
import { MultiColumnFieldProps } from '../field-types';
import { getSpans } from './multicolumn-field-utils';
import MultiColumnFieldFooter from './MultiColumnFieldFooter';
import MultiColumnFieldHeader from './MultiColumnFieldHeader';
import MultiColumnFieldRow from './MultiColumnFieldRow';
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
  tooltipDeleteRow,
  disableAddRow,
  tooltipAddRow,
  spans,
  complexFields,
  rowRenderer,
  ...props
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
            data-test={props['data-test'] || 'multicolumn-field'}
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
                  rowIndex={index}
                  isReadOnly={isReadOnly}
                  spans={fieldSpans}
                  complexFields={complexFields}
                  rowRenderer={rowRenderer}
                  disableDeleteRow={disableDeleteRow}
                  tooltipDeleteRow={tooltipDeleteRow}
                  onDelete={() => remove(index)}
                >
                  {children}
                </MultiColumnFieldRow>
              ))}
            {!isReadOnly && (
              <MultiColumnFieldFooter
                disableAddRow={disableAddRow}
                tooltipAddRow={tooltipAddRow}
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
