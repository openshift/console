import type { FC } from 'react';
import { Switch } from '@patternfly/react-core';
import type { CheckboxFieldProps } from './field-types';
import ToggleableFieldBase from './ToggleableFieldBase';

export const SwitchField: FC<CheckboxFieldProps> = (baseProps) => (
  <ToggleableFieldBase {...baseProps}>
    {({ isValid, ...props }) => <Switch {...props} />}
  </ToggleableFieldBase>
);
