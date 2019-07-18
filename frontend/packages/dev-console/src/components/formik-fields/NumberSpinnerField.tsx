import * as React from 'react';
import * as _ from 'lodash';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { NumberSpinner } from '@console/internal/components/utils';
import { InputFieldProps } from './field-types';
import { getValidationState } from './field-utils';

const NumberSpinnerField: React.FC<InputFieldProps> = ({ label, helpText, ...props }) => {
  const [field, { touched, error }] = useField(props.name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  return (
    <FormGroup
      controlId={`${props.name}-field`}
      validationState={getValidationState(error, touched)}
    >
      {label && (
        <ControlLabel className={cx({ 'co-required': props.required })}>{label}</ControlLabel>
      )}
      <NumberSpinner
        id={`${props.name}-field`}
        {...field}
        {...props}
        changeValueBy={(operation: number) => {
          setFieldValue(props.name, _.toInteger(field.value) + operation);
          setFieldTouched(props.name, true);
        }}
        aria-describedby={helpText && `${props.name}-help`}
      />
      {helpText && <HelpBlock id={`${props.name}-help`}>{helpText}</HelpBlock>}
      {touched && error && <HelpBlock>{error}</HelpBlock>}
    </FormGroup>
  );
};

export default NumberSpinnerField;
