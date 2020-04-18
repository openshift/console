import * as React from 'react';
import { FirehoseResult } from '@console/internal/components/utils';
import { DropdownField } from '@console/shared';
import { TriggerBindingKind } from '../../resource-types';

type TriggerBindingSelectorProps = {
  description?: string;
  label: string;
  onChange: (selectedTriggerBinding: TriggerBindingKind) => void;
  triggerBindingData?: FirehoseResult<TriggerBindingKind[]>;
};

const TriggerBindingSelectorDropdown: React.FC<TriggerBindingSelectorProps> = (props) => {
  const { description, label, onChange, triggerBindingData } = props;
  const triggerBindings = triggerBindingData.data;
  const dropdownItems = triggerBindings.reduce(
    (acc, triggerBinding) => ({
      ...acc,
      [triggerBinding.metadata.name]: triggerBinding.metadata.name,
    }),
    {},
  );

  return (
    <DropdownField
      fullWidth
      helpText={description}
      items={dropdownItems}
      label={label}
      name="triggerBinding.name"
      onChange={(name: string) => {
        onChange(triggerBindings.find((triggerBinding) => triggerBinding.metadata.name === name));
      }}
      title={`Select ${label}`}
    />
  );
};

export default TriggerBindingSelectorDropdown;
