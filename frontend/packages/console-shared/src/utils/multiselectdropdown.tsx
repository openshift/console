import * as React from 'react';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  onChange,
  placeholder,
  id,
  options,
  defaultSelected = [],
}) => {
  const [isOpen, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(defaultSelected || []);
  const onSelect = (event: React.MouseEvent | React.ChangeEvent, selection: string) => {
    let cSelected: string[] = selected;
    if (selected.includes(selection)) {
      cSelected = selected.filter((item) => item !== selection);
    } else {
      cSelected = [...selected, selection];
    }
    setSelected(cSelected);
    onChange(cSelected);
  };

  const { t } = useTranslation();

  const items: JSX.Element[] = options.map((item) => {
    return <SelectOption key={item} value={item} />;
  });
  return (
    <div>
      <Select
        variant={SelectVariant.typeaheadMulti}
        aria-label={t('console-shared~Select input')}
        onToggle={setOpen}
        onSelect={onSelect}
        selections={selected}
        isOpen={isOpen}
        placeholderText={placeholder || t('console-shared~Select options')}
        aria-labelledby={id}
        noResultsFoundText={t('console-shared~No results found')}
      >
        {items}
      </Select>
    </div>
  );
};

export type MultiSelectDropdownProps = {
  id?: string;
  options?: string[];
  defaultSelected?: string[];
  placeholder?: string;
  onChange: (selected: string[]) => void;
};
