import * as React from 'react';
import { MultiTypeaheadSelect, MultiTypeaheadSelectOption } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  onChange,
  placeholder,
  id,
  options,
  defaultSelected = [],
}) => {
  const [selected, setSelected] = React.useState<string[]>(defaultSelected || []);
  const { t } = useTranslation();

  const initialOptions = React.useMemo<MultiTypeaheadSelectOption[]>(
    () => options.map((opt) => ({ content: opt, value: opt, selected: selected.includes(opt) })),
    [selected, options],
  );

  const onSelect = (event: React.MouseEvent | React.ChangeEvent, selections: string[]) => {
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
        onKeyDown: (event: React.KeyboardEvent<any>) => {
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
