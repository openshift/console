import * as React from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup, Select, SelectVariant, SelectOption } from '@patternfly/react-core';
import { useFormikValidationFix, getFieldId } from '@console/shared';

interface RouteInputFieldProps {
  name: string;
  label: string;
  options: string[];
  placeholderText: string;
  helpText: string;
}

const PortInputField: React.FC<RouteInputFieldProps> = ({
  name,
  label,
  options,
  placeholderText,
  helpText,
}) => {
  const [field, { touched, error }] = useField<string>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const fieldId = getFieldId(name, 'select-input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event, selection: string) => {
    setFieldValue(name, selection);
    setFieldTouched(name);
    onToggle();
  };

  const onClearSelection = () => {
    setFieldValue(name, '');
    setFieldTouched(name);
  };

  return (
    <FormGroup
      fieldId={fieldId}
      validated={isValid ? 'default' : 'error'}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
    >
      <Select
        variant={SelectVariant.typeahead}
        onToggle={onToggle}
        onSelect={onSelect}
        onClear={onClearSelection}
        isOpen={isOpen}
        selections={field.value}
        placeholderText={placeholderText}
        isCreatable
      >
        {options.map((val) => (
          <SelectOption value={val} key={val} />
        ))}
      </Select>
    </FormGroup>
  );
};

export default PortInputField;
