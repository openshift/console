/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import { CheckboxFieldProps } from './field-types';
import ToggleableFieldBase from './ToggleableFieldBase';

const CheckboxField: React.FC<CheckboxFieldProps> = (baseProps) => (
  <ToggleableFieldBase {...baseProps}>{(props) => <Checkbox {...props} />}</ToggleableFieldBase>
);

export default CheckboxField;
