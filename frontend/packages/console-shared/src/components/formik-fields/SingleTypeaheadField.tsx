import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { SingleTypeaheadDropdown } from '@console/internal/components/utils/single-typeahead-dropdown';
import { useFormikValidationFix } from '../../hooks';
import { RedExclamationCircleIcon } from '../status';
import { SingleTypeaheadFieldProps, SelectInputOption } from './field-types';
import { getFieldId } from './field-utils';

const SingleTypeaheadField: React.FC<SingleTypeaheadFieldProps> = ({
  name,
  label,
  ariaLabel,
  options,
  placeholderText,
  isCreatable,
  helpText,
  required,
  toggleOnSelection,
  hideClearButton,
  isDisabled,
  onChange,
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

  const onSelect = (selection: string) => {
    if (onChange) {
      onChange(selection);
    } else {
      setFieldValue(name, selection);
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
    setFieldValue(name, []);
    setFieldTouched(name);
  };

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <SingleTypeaheadDropdown
        items={_.map(options, (option) => ({
          children: option.label || option.value,
          value: option.value,
          isDisabled: option.disabled,
          description: option.description,
          ...option,
        }))}
        onChange={onSelect}
        onInputChange={onSelect}
        selectedKey={field.value as string}
        hideClearButton={hideClearButton}
        placeholder={placeholderText}
        enableCreateNew={isCreatable}
        onCreate={onCreateOption}
        onClear={onClearSelection}
        menuToggleProps={{
          isDisabled,
          isFullWidth: true,
          status: isValid ? undefined : 'danger',
        }}
        selectProps={{
          'aria-label': ariaLabel,
          popperProps: {
            // prevents dropdown from going off screen
            maxWidth: 'trigger',
          },
        }}
      />

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

export default SingleTypeaheadField;
