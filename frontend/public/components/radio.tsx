import type { InputHTMLAttributes, ReactNode } from 'react';
import { FormGroup, Radio } from '@patternfly/react-core';

export const RadioGroup = ({ currentValue, items, label, onChange }: RadioGroupProps) => {
  const radios = items.map(({ label: radioLabel, value, disabled, name, description }) => {
    const checked = value === currentValue;
    return (
      <Radio
        key={value}
        id={value}
        name={name}
        value={value}
        label={radioLabel}
        description={description}
        onChange={onChange}
        isChecked={checked}
        data-checked-state={checked}
        isDisabled={disabled}
        data-test={`${radioLabel}-radio-input`}
      />
    );
  });
  return (
    // use div.pf-v6-c-form instead of Form to avoid additional form element
    (<div className="pf-v6-c-form">
      <FormGroup role="radiogroup" fieldId={label ?? 'pf-radio-group'} label={label} isStack>
        {radios}
      </FormGroup>
    </div>)
  );
};

export type RadioGroupProps = {
  currentValue: string;
  id?: string;
  items: RadioGroupItems;
  label?: string;
  onChange: InputHTMLAttributes<any>['onChange'];
};

export type RadioGroupItems = {
  name: string;
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}[];
