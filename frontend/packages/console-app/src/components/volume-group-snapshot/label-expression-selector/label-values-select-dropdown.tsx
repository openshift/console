import * as React from 'react';
import { MultiTypeaheadSelect, MultiTypeaheadSelectOption } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';

export const LabelValueSelectDropdown: React.FC<LabelValueSelectDropdownProps> = ({
  onChange,
  placeholderText,
  id,
  selectOptions,
  selections = [],
}) => {
  const { t } = useTranslation();

  const initialOptions = React.useMemo<MultiTypeaheadSelectOption[]>(
    () => selectOptions.map((o) => ({ ...o, selected: selections.includes(o.value) })),
    [selectOptions, selections],
  );

  return (
    <MultiTypeaheadSelect
      id={id}
      selected={selections}
      onSelectionChange={(_ev, newSelections) => {
        onChange(newSelections);
      }}
      initialOptions={initialOptions}
      placeholder={placeholderText || t('Select options')}
    />
  );
};

export type LabelValueSelectDropdownProps = {
  id?: string;
  options?: string[];
  selectOptions: { content: string; value: string }[];
  onChange: (selected: (string | number)[], selection?: string) => void;
  selections: string[];
  placeholderText?: string;
};
