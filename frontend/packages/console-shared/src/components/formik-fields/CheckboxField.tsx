/* eslint-disable no-unused-vars, no-undef */
import type { FC } from 'react';
import { Checkbox } from '@patternfly/react-core';
import type { CheckboxFieldProps } from './field-types';
import ToggleableFieldBase from './ToggleableFieldBase';

export const CheckboxField: FC<CheckboxFieldProps> = (baseProps) => (
  <ToggleableFieldBase {...baseProps}>
    {(props) => <Checkbox {...props} data-checked-state={props.isChecked} />}
  </ToggleableFieldBase>
);
