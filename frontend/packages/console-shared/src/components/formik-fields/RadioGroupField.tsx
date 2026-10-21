import type { FC } from 'react';
import { Fragment } from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { useField } from 'formik';
import type { RadioGroupFieldProps } from './field-types';
import { getFieldId } from './field-utils';
import RadioButtonField from './RadioButtonField';

import './RadioGroupField.scss';

const RadioGroupField: FC<RadioGroupFieldProps> = ({
  label,
  labelIcon,
  options,
  helpText,
  required,
  isInline,
  onChange,
  ...props
}) => {
  const [field, { touched, error }] = useField(props.name);
  const fieldId = getFieldId(props.name, 'radiogroup');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      className={css('ocs-radio-group-field', { 'ocs-radio-group-field--inline': isInline })}
      fieldId={fieldId}
      isRequired={required}
      label={label}
      labelHelp={labelIcon}
      isInline={isInline}
    >
      {options.map((option) => {
        const activeChild = field.value === option.value && option.activeChildren;
        const staticChild = option.children;

        const description = (activeChild || staticChild) && (
          <div className="ocs-radio-group-field__children">
            {staticChild}
            {activeChild}
          </div>
        );

        return (
          <Fragment key={option.value}>
            <RadioButtonField
              {...field}
              {...props}
              value={option.value}
              label={option.label}
              isDisabled={option.isDisabled}
              isChecked={option.isChecked}
              aria-describedby={helpText ? `${fieldId}-helper` : undefined}
              description={description}
              onChange={onChange}
            />
          </Fragment>
        );
      })}
      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default RadioGroupField;
