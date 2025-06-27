import * as React from 'react';
import { Form, FormGroup, Radio } from '@patternfly/react-core';

const getRadioId = (id: string) => {
  return id ? `${id}` : 'pf-v6-c-radio-input-id';
};

export const RadioGroup = ({ currentValue, items, label, onChange }: RadioGroupProps) => {
  const radios = items.map(({ label: radioLabel, value, disabled, name, description }) => {
    const checked = value === currentValue;
    return (
      <Radio
        key={value}
        id={getRadioId(value)}
        name={name}
        value={value}
        label={radioLabel}
        description={description}
        onChange={onChange}
        isDisabled={disabled}
        data-test={`${radioLabel}-radio-input`}
        checked={checked}
        data-checked-state={checked}
      />
    );
  });
  return (
    <Form>
      <FormGroup role="radiogroup" fieldId="pf-radio-group" label={label}>
        {radios}
      </FormGroup>
    </Form>
  );
};

export type RadioGroupProps = {
  currentValue: string;
  id?: string;
  items: RadioGroupItems;
  label?: string;
  onChange: React.InputHTMLAttributes<any>['onChange'];
};

export type RadioGroupItems = {
  value: string;
  name: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}[];
