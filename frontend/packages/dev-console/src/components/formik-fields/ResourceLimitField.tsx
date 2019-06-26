import * as React from 'react';
import * as _ from 'lodash';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { RequestSizeInput } from '@console/internal/components/utils';
import { getValidationState } from './field-utils';
import { ResourceLimitFieldProps } from './field-types';

const ResourceLimitField: React.FC<ResourceLimitFieldProps> = ({
  inputLabel,
  name,
  unitName,
  helpText,
  ...props
}) => {
  const [field, { touched, error }] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();

  const onRequestSizeInputChange = (val) => {
    setFieldValue(name, _.toNumber(val.value));
    setFieldValue(unitName, val.unit);
    setFieldTouched(name, true);
  };

  return (
    <FormGroup controlId={`${name}-field`} validationState={getValidationState(error, touched)}>
      <ControlLabel className={cx({ 'co-required': props.required })}>{inputLabel}</ControlLabel>
      <RequestSizeInput
        name={name}
        onChange={onRequestSizeInputChange}
        dropdownUnits={props.unitItems}
        defaultRequestSizeUnit={props.unitSelectedKey}
        defaultRequestSizeValue={field.value}
        describedBy={`${name}-help`}
      />
      {helpText && <HelpBlock id={`${name}-help`}>{helpText}</HelpBlock>}
      {touched && error && <HelpBlock>{error}</HelpBlock>}
    </FormGroup>
  );
};

export default ResourceLimitField;
