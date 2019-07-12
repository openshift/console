import * as React from 'react';
import cx from 'classnames';
import { useField } from 'formik';
import { ControlLabel, FormControl, FormGroup, HelpBlock, InputGroup } from 'patternfly-react';
import { SearchInputFieldProps } from './field-types';
import { getValidationState } from './field-utils';

const InputSearchField: React.FC<SearchInputFieldProps> = ({
  label,
  helpText,
  onSearch,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  return (
    <FormGroup
      controlId={`${props.name}-field`}
      validationState={getValidationState(error, touched)}
    >
      <ControlLabel className={cx({ 'co-required': props.required })}>{label}</ControlLabel>
      <InputGroup>
        <FormControl
          {...field}
          {...props}
          aria-describedby={helpText && `${props.name}-help`}
          onKeyDown={(e: KeyboardEvent) => e.keyCode === 13 && onSearch(field.value)}
        />
        <span className="input-group-btn ">
          <button
            type="button"
            className="btn btn-default"
            data-test-id="input-search-field-btn"
            onClick={() => onSearch(field.value)}
            disabled={!field.value}
          >
            <i className="fa fa-search" aria-hidden="true" />
            <span className="sr-only">Find</span>
          </button>
        </span>
      </InputGroup>
      {helpText && <HelpBlock id={`${props.name}-help`}>{helpText}</HelpBlock>}
      {touched && error && <HelpBlock>{error}</HelpBlock>}
    </FormGroup>
  );
};

export default InputSearchField;
