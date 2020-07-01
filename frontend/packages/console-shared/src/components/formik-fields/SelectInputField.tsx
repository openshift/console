import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { FormGroup, Select, SelectVariant, SelectOption } from '@patternfly/react-core';
import { getFieldId } from './field-utils';
import { FieldProps } from './field-types';

interface SelectInputFieldProps extends FieldProps {
  options: { value: string; disabled: boolean }[];
  placeholderText?: React.ReactNode;
  isCreatable?: boolean;
  hasOnCreateOption?: boolean;
}

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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const fieldId = getFieldId(name, 'select-input');
  const isValid = !(touched && error);

  const onToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const onSelect = (event, selection) => {
    const selections = field.value;
    if (_.includes(selections, selection)) {
      setFieldValue(name, _.pull(selections, selection));
    } else {
      setFieldValue(name, [...selections, selection]);
    }
    setFieldTouched(name);
  };

  const onCreateOption = (newVal) => {
    const selections = field.value;
    setFieldValue(name, [...selections, newVal]);
    setFieldTouched(name);
  };

  const onClearSelection = () => {
    setFieldValue(name, []);
    setFieldTouched(name);
  };

  return (
    <FormGroup
      fieldId={fieldId}
      isValid={isValid}
      label={label}
      helperText={helpText}
      isRequired={required}
    >
      <Select
        variant={SelectVariant.typeaheadMulti}
        onToggle={onToggle}
        onSelect={onSelect}
        onClear={onClearSelection}
        isExpanded={isExpanded}
        selections={field.value}
        placeholderText={placeholderText}
        isCreatable={isCreatable}
        onCreateOption={(hasOnCreateOption && onCreateOption) || undefined}
      >
        {_.map(options, (op) => (
          <SelectOption value={op.value} isDisabled={op.disabled} key={op.value} />
        ))}
      </Select>
    </FormGroup>
  );
};

export default SelectInputField;
