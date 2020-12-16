import * as React from 'react';
import { FirehoseResult } from '@console/internal/components/utils';
import { DropdownField } from '@console/shared';
import { TriggerBindingKind } from '../../resource-types';

type TriggerBindingSelectorProps = {
  clusterTriggerBindingData?: FirehoseResult<TriggerBindingKind[]>;
  description?: string;
  label: string;
  onChange: (selectedTriggerBinding: TriggerBindingKind) => void;
  triggerBindingData?: FirehoseResult<TriggerBindingKind[]>;
};

const TriggerBindingSelectorDropdown: React.FC<TriggerBindingSelectorProps> = (props) => {
  const { clusterTriggerBindingData, description, label, onChange, triggerBindingData } = props;
  const triggerBindings = triggerBindingData?.data || [];
  const clusterTriggerBindings = clusterTriggerBindingData?.data || [];
  const bindings = [...triggerBindings, ...clusterTriggerBindings];
  const dropdownItems = bindings.reduce(
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
      disabled={Object.keys(dropdownItems).length === 0}
      label={label}
      name="triggerBinding.name"
      onChange={(name: string) => {
        onChange(bindings.find((triggerBinding) => triggerBinding.metadata.name === name));
      }}
      title={`Select ${label}`}
    />
  );
};

export default TriggerBindingSelectorDropdown;
