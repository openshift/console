import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputGroup,
  InputGroupItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';

import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { TextFilter } from './factory';

export enum searchFilterValues {
  // t('public~Label')
  Label = 'Label',
  // t('public~Name')
  Name = 'Name',
}

export const SearchFilterDropdown: React.FC<SearchFilterDropdownProps> = ({
  labelFilterInput,
  nameFilterInput,
  onChange,
}) => {
  const [isOpen, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(searchFilterValues.Label);
  const { t } = useTranslation();

  const onToggle = () => setOpen(!isOpen);
  const onSelect = (event: React.SyntheticEvent, value: string) => {
    setSelected(value as searchFilterValues);
    setOpen(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const { value } = e.target as HTMLInputElement;
      onChange(selected, value, true);
    }
  };
  const handleInputValue = (_event, value: string) => {
    onChange(selected, value, false);
  };

  const selectItems = [
    <SelectOption key="label-action" data-test="label-filter" value={searchFilterValues.Label}>
      {t(searchFilterValues.Label)}
    </SelectOption>,
    <SelectOption key="name-action" data-test="name-filter" value={searchFilterValues.Name}>
      {t(searchFilterValues.Name)}
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
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => {
            return (
              <MenuToggle
                ref={toggleRef}
                isExpanded={isOpen}
                onClick={onToggle}
                icon={<FilterIcon />}
                id="search-filter-toggle"
              >
                {selected}
              </MenuToggle>
            );
          }}
          shouldFocusToggleOnSelect
        >
          <SelectList>{selectItems}</SelectList>
        </Select>
      </InputGroupItem>
      <InputGroupItem>
        <TextFilter
          onChange={handleInputValue}
          placeholder={selected === searchFilterValues.Label ? 'app=frontend' : 'my-resource'}
          name="search-filter-input"
          id="search-filter-input"
          value={selected === searchFilterValues.Label ? labelFilterInput : nameFilterInput}
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
