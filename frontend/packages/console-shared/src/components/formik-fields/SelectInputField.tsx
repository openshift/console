import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import {
  Select as SelectDeprecated,
  SelectOption as SelectOptionDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useFormikValidationFix } from '../../hooks';
import { RedExclamationCircleIcon } from '../status';
import { SelectInputFieldProps, SelectInputOption } from './field-types';
import { getFieldId } from './field-utils';

const SelectInputField: React.FC<SelectInputFieldProps> = ({
  name,
  label,
  ariaLabel,
  variant,
  options,
  placeholderText,
  isCreatable,
  hasOnCreateOption,
  helpText,
  required,
  isInputValuePersisted,
  noResultsFoundText,
  toggleOnSelection,
  hideClearButton,
  isDisabled,
  onChange,
  getLabelFromValue,
}) => {
  const [field, { touched, error }] = useField<string | string[]>(name);
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
    if (onChange) {
      onChange(selection);
    } else if (
      variant !== SelectVariantDeprecated.typeaheadMulti &&
      variant !== SelectVariantDeprecated.checkbox
    ) {
      setFieldValue(name, selection);
    } else {
      const selections = field.value;
      if (_.includes(selections, selection)) {
        setFieldValue(name, _.pull(selections, selection));
      } else {
        setFieldValue(name, [...selections, selection]);
      }
    }
    setFieldTouched(name);
    toggleOnSelection && onToggle();
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
    if (
      variant !== SelectVariantDeprecated.typeaheadMulti &&
      variant !== SelectVariantDeprecated.checkbox
    ) {
      setFieldValue(name, '');
    } else {
      setFieldValue(name, []);
    }
    setFieldTouched(name);
  };

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <SelectDeprecated
        toggleId={fieldId}
        variant={variant}
        aria-describedby={helpText ? `${fieldId}-helper` : undefined}
        typeAheadAriaLabel={ariaLabel}
        onToggle={onToggle}
        onSelect={onSelect}
        onClear={hideClearButton ? SelectDeprecated.defaultProps.onClear : onClearSelection}
        isOpen={isOpen}
        isDisabled={isDisabled}
        selections={getLabelFromValue ? getLabelFromValue(field.value as string) : field.value}
        placeholderText={placeholderText}
        isCreatable={isCreatable}
        onCreateOption={(hasOnCreateOption && onCreateOption) || undefined}
        isInputValuePersisted={isInputValuePersisted}
        noResultsFoundText={noResultsFoundText}
      >
        {_.map([...options, ...newOptions], (op) => (
          <SelectOptionDeprecated
            value={op.label ? op.label : op.value}
            isDisabled={op.disabled}
            key={op.value}
            id={`select-option-${name}-${op.value}`}
            description={op.description ?? ''}
          />
        ))}
      </SelectDeprecated>

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

export default SelectInputField;
