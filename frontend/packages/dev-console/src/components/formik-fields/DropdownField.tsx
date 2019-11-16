import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Dropdown } from '@console/internal/components/utils';
import { FormGroup } from '@patternfly/react-core';
import { DropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import './_dropdown-field.scss';

const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  helpText,
  required,
  consumedItems,
  handleDuplicateEntry,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(props.name, 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  const checkDuplicateItemEntry = (items, fieldReference): boolean => {
    let occurence = 0;
    if (items && items.length > 0) {
      items.forEach((element) => {
        if (element === fieldReference.value) {
          occurence++;
        }
      });
    }
    return occurence > 1;
  };
  const isDuplicateEntry = checkDuplicateItemEntry(consumedItems, field);
  if (handleDuplicateEntry) {
    handleDuplicateEntry(isDuplicateEntry);
  }

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
    >
      <Dropdown
        {...props}
        id={fieldId}
        selectedKey={field.value}
        dropDownClassName={cx({ 'dropdown--full-width': props.fullWidth })}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value: string) => {
          props.onChange && props.onChange(value);
          setFieldValue(props.name, value);
          setFieldTouched(props.name, true);
        }}
        isValid={!isDuplicateEntry}
      />
      {isDuplicateEntry && <p className="odc-dropdown-field__inline-error">Duplicate detected.</p>}
    </FormGroup>
  );
};

export default DropdownField;
