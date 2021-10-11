import * as React from 'react';
import { FormGroup, Select, SelectVariant, SelectOption } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useFormikValidationFix } from '../../hooks';
import { SelectInputFieldProps, SelectInputOption } from './field-types';
import { getFieldId } from './field-utils';

const SelectInputField: React.FC<SelectInputFieldProps> = ({
  name,
  label,
  options,
  placeholderText,
  isCreatable,
  hasOnCreateOption,
  helpText,
  required,
}) => {
  const [field, { touched, error }] = useField<string[]>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [newOptions, setNewOptions] = React.useState<SelectInputOption[]>([]);
  const fieldId = getFieldId(name, 'select-input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (event, selection: string) => {
    const selections = field.value;
    if (_.includes(selections, selection)) {
      setFieldValue(name, _.pull(selections, selection));
    } else {
      setFieldValue(name, [...selections, selection]);
    }
    setFieldTouched(name);
  };

  const onCreateOption = (newVal: string) => {
    const hasDuplicateOption = [...newOptions, ...options].find(
      (option) => option.value === newVal,
    );
    if (!hasDuplicateOption) {
      setNewOptions([...newOptions, { value: newVal, disabled: false }]);
    }
  };

  const onClearSelection = () => {
    setFieldValue(name, []);
    setFieldTouched(name);
  };

  return (
    <FormGroup
      fieldId={fieldId}
      validated={isValid ? 'default' : 'error'}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isRequired={required}
    >
      <Select
        variant={SelectVariant.typeaheadMulti}
        onToggle={onToggle}
        onSelect={onSelect}
        onClear={onClearSelection}
        isOpen={isOpen}
        selections={field.value}
        placeholderText={placeholderText}
        isCreatable={isCreatable}
        onCreateOption={(hasOnCreateOption && onCreateOption) || undefined}
      >
        {_.map([...options, ...newOptions], (op) => (
          <SelectOption value={op.value} isDisabled={op.disabled} key={op.value} />
        ))}
      </Select>
    </FormGroup>
  );
};

export default SelectInputField;
