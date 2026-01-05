import type { ReactEventHandler } from 'react';
import { Checkbox as PFCheckbox } from '@patternfly/react-core';

export const Checkbox = ({ name, label, checked, onChange }: CheckboxProps) => (
  <div className="form-group">
    <PFCheckbox
      data-test={`${label}__checkbox`}
      name={name}
      onChange={onChange}
      isChecked={checked}
      data-checked-state={checked}
      id={`${label}__checkbox`}
      label={label}
      className="pf-v6-u-my-sm"
    />
  </div>
);

export type CheckboxProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: ReactEventHandler<HTMLInputElement>;
};
