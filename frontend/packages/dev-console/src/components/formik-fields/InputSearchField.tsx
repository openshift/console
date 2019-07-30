import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, InputGroup, TextInput, Button, ButtonVariant } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { SearchInputFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const InputSearchField: React.FC<SearchInputFieldProps> = ({
  label,
  helpText,
  onSearch,
  required,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'input-search');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helpText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={required}
    >
      <InputGroup>
        <TextInput
          {...field}
          {...props}
          id={fieldId}
          isValid={isValid}
          isRequired={required}
          aria-describedby={`${fieldId}-helper`}
          onChange={(value, event) => field.onChange(event)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.keyCode === 13) {
              e.preventDefault();
              e.stopPropagation();
              onSearch(field.value);
            }
          }}
        />
        <Button
          variant={ButtonVariant.secondary}
          aria-label="search button for search input"
          data-test-id="input-search-field-btn"
          onClick={() => onSearch(field.value)}
          isDisabled={!field.value}
        >
          <SearchIcon />
        </Button>
      </InputGroup>
    </FormGroup>
  );
};

export default InputSearchField;
