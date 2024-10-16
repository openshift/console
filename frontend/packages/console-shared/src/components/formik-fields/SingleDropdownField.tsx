import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import { useFormikValidationFix } from '../../hooks';
import { RedExclamationCircleIcon } from '../status';
import { SingleDropdownFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const SingleDropdownField: React.FC<SingleDropdownFieldProps> = ({
  name,
  label,
  ariaLabel,
  options,
  placeholderText,
  helpText,
  required,
  toggleOnSelection,
  isDisabled,
  onChange,
  getLabelFromValue,
}) => {
  const [field, { touched, error }] = useField<string | string[]>(name);
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
    if (onChange) {
      onChange(selection);
    } else {
      setFieldValue(name, selection);
    }
    setFieldTouched(name);
    toggleOnSelection && onToggle();
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      id={fieldId}
      onClick={onToggle}
      ref={toggleRef}
      isExpanded={isOpen}
      aria-label={ariaLabel}
      isFullWidth
      status={isValid ? undefined : 'danger'}
    >
      {getLabelFromValue
        ? getLabelFromValue(field.value as string)
        : field.value || placeholderText}
    </MenuToggle>
  );

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <Select
        toggle={toggle}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        aria-label={ariaLabel}
        onSelect={onSelect}
        isOpen={isOpen}
        isDisabled={isDisabled}
        onOpenChange={setIsOpen}
        popperProps={{ maxWidth: 'trigger' }} // prevents dropdown from going off screen
      >
        <SelectList>
          {options.map((op) => (
            <SelectOption
              value={op.label ? op.label : op.value}
              isDisabled={op.disabled}
              key={op.value}
              id={`select-option-${name}-${op.value}`}
              description={op.description ?? ''}
              hasCheckbox={op.hasCheckbox}
              isSelected={field.value === op.value}
            >
              {op.label}
            </SelectOption>
          ))}
        </SelectList>
      </Select>

      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {errorMessage}
            </HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default SingleDropdownField;
