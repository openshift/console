import * as React from 'react';
import { Switch } from '@patternfly/react-core';
import { CheckboxFieldProps } from './field-types';
import ToggleableFieldBase from './ToggleableFieldBase';

const SwitchField: React.FC<CheckboxFieldProps> = (baseProps) => (
  <ToggleableFieldBase {...baseProps}>
    {({ isValid, ...props }) => <Switch {...props} />}
  </ToggleableFieldBase>
);

export default SwitchField;
