import * as React from 'react';

import { RadioGroup } from '@console/internal/components/radio';
import { ToggleValue } from './types';

const ToggleView: React.FC<ToggleViewProps> = ({ value, onChange, label, optionTitles }) => {
  return (
    <RadioGroup
      label={label}
      currentValue={value}
      inline
      items={[
        {
          value: ToggleValue.LEFT_OPTION,
          title: optionTitles[0],
        },
        {
          value: ToggleValue.RIGHT_OPTION,
          title: optionTitles[1],
        },
      ]}
      onChange={({ currentTarget }) => onChange(currentTarget.value as ToggleValue)}
    />
  );
};

export default ToggleView;

type ToggleViewProps = {
  value: ToggleValue;
  onChange: (newValue: ToggleValue) => void;
  label: string;
  optionTitles: string[];
};
