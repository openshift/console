import type { FC, SyntheticEvent, KeyboardEvent, Ref } from 'react';
import { useState } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  InputGroup,
  InputGroupItem,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { RhUiFilterIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TextFilter } from './factory/text-filter';

export enum SearchFilterValues {
  // t('public~Label')
  Label = 'Label',
  // t('public~Name')
  Name = 'Name',
}

export const SearchFilterDropdown: FC<SearchFilterDropdownProps> = ({
  labelFilterInput,
  nameFilterInput,
  onChange,
}) => {
  const [isOpen, setOpen] = useState(false);
  // Default to filtering by Name to stay consistent with the other resource lists in the console.
  const [selected, setSelected] = useState(SearchFilterValues.Name);
  const { t } = useTranslation('public');

  const onToggle = () => setOpen(!isOpen);
  const onSelect = (event: SyntheticEvent, value: string) => {
    setSelected(value as SearchFilterValues);
    setOpen(false);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const { value } = e.target as HTMLInputElement;
      onChange(selected, value, true);
    }
  };
  const handleInputValue = (_event, value: string) => {
    onChange(selected, value, false);
  };

  const selectItems = [
    <SelectOption key="label-action" data-test="label-filter" value={SearchFilterValues.Label}>
      {t(SearchFilterValues.Label)}
    </SelectOption>,
    <SelectOption key="name-action" data-test="name-filter" value={SearchFilterValues.Name}>
      {t(SearchFilterValues.Name)}
    </SelectOption>,
  ];

  return (
    <InputGroup>
      <InputGroupItem>
        <Select
          isOpen={isOpen}
          selected={selected}
          onSelect={onSelect}
          onOpenChange={(lala) => setOpen(lala)}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              isExpanded={isOpen}
              onClick={onToggle}
              icon={<RhUiFilterIcon />}
              id="search-filter-toggle"
            >
              {t(selected)}
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <SelectList>{selectItems}</SelectList>
        </Select>
      </InputGroupItem>
      <InputGroupItem>
        <TextFilter
          onChange={handleInputValue}
          placeholder={selected === SearchFilterValues.Label ? 'app=frontend' : 'my-resource'}
          name="search-filter-input"
          id="search-filter-input"
          value={selected === SearchFilterValues.Label ? labelFilterInput : nameFilterInput}
          onKeyDown={handleKeyDown}
          aria-labelledby="search-filter-toggle"
        />
      </InputGroupItem>
    </InputGroup>
  );
};

export type SearchFilterDropdownProps = {
  labelFilterInput: string;
  nameFilterInput: string;
  onChange: (type: string, value: string, endOfString: boolean) => void;
};
