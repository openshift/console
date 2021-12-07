import * as React from 'react';

export const Checkbox: React.SFC<CheckboxProps> = ({ name, label, checked, onChange }) => (
  <div className="form-group">
    <div className="checkbox">
      <label className="control-label">
        <input
          data-test={`${label}__checkbox`}
          className="form-checkbox"
          name={name}
          onChange={onChange}
          checked={checked}
          data-checked-state={checked}
          type="checkbox"
        />
        {label}
      </label>
    </div>
  </div>
);

export type CheckboxProps = {
  name: string;
  label: string;
  onChange: React.ReactEventHandler<HTMLInputElement>;
  checked: boolean;
};
