import type { FC, KeyboardEvent } from 'react';
import { useState, useMemo } from 'react';
import type { MultiTypeaheadSelectOption } from '@patternfly/react-templates';
import { MultiTypeaheadSelect } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';

export const MultiSelectDropdown: FC<MultiSelectDropdownProps> = ({
  onChange,
  placeholder,
  id,
  options,
  defaultSelected = [],
}) => {
  const [selected, setSelected] = useState<string[]>(defaultSelected || []);
  const { t } = useTranslation();

  const initialOptions = useMemo<MultiTypeaheadSelectOption[]>(
    () => options.map((opt) => ({ content: opt, value: opt, selected: selected.includes(opt) })),
    [selected, options],
  );

  const onSelect = (event: React.UIEvent, selections: string[]) => {
    event.preventDefault();
    setSelected(selections);
    onChange(selections);
  };

  return (
    <MultiTypeaheadSelect
      initialOptions={initialOptions}
      placeholder={placeholder || t('console-shared~Select options')}
      noOptionsFoundMessage={t('console-shared~No results found')}
      onSelectionChange={onSelect}
      aria-label={t('console-shared~Select input')}
      aria-labelledby={id}
      toggleProps={{
        onKeyDown: (event: KeyboardEvent<any>) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        },
      }}
    />
  );
};

export type MultiSelectDropdownProps = {
  id?: string;
  options?: string[];
  defaultSelected?: string[];
  placeholder?: string;
  onChange: (selected: string[]) => void;
};
