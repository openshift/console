import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem, TextInput } from '@patternfly/react-core';
import { CaretDownIcon, FilterIcon } from '@patternfly/react-icons';

export enum searchFilterValues {
  Label = 'Label',
  Name = 'Name',
}

export const SearchFilterDropdown: React.SFC<SearchFilterDropdownProps> = (props) => {
  const [isOpen, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(searchFilterValues.Label);
  const [inputValue, setInputValue] = React.useState('');

  const { onChange } = props;

  const onToggle = (open: boolean) => setOpen(open);
  const onSelect = (event: React.SyntheticEvent) => {
    setSelected((event.target as HTMLInputElement).name as searchFilterValues);
    setOpen(!isOpen);
  };
  const dropdownItems = [
    <DropdownItem key="label-action" name={searchFilterValues.Label} component="button">
      {searchFilterValues.Label}
    </DropdownItem>,
    <DropdownItem key="name-action" name={searchFilterValues.Name} component="button">
      {searchFilterValues.Name}
    </DropdownItem>,
  ];
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(selected, inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="form-group co-search-group__filter">
      <div className="pf-c-input-group">
        <Dropdown
          onSelect={onSelect}
          toggle={
            <DropdownToggle id="toggle-id" onToggle={onToggle} iconComponent={CaretDownIcon}>
              <>
                <FilterIcon className="span--icon__right-margin" /> {selected}
              </>
            </DropdownToggle>
          }
          isOpen={isOpen}
          dropdownItems={dropdownItems}
        />
        <TextInput
          onChange={setInputValue}
          placeholder={
            selected === searchFilterValues.Label ? 'Filter by label...' : 'Filter by name...'
          }
          name="search-filter-input"
          id="search-filter-input"
          value={inputValue}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

export type SearchFilterDropdownProps = {
  onChange: (type: string, value: string) => void;
};
