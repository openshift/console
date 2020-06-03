import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { CaretDownIcon, FilterIcon } from '@patternfly/react-icons';
import { TextFilter } from './factory';

export enum searchFilterValues {
  Label = 'Label',
  Name = 'Name',
}

export const SearchFilterDropdown: React.SFC<SearchFilterDropdownProps> = (props) => {
  const [isOpen, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(searchFilterValues.Label);

  const { onChange, nameFilterInput, labelFilterInput } = props;

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
      const { value } = e.target as HTMLInputElement;
      onChange(selected, value, true);
    }
  };

  const handleInputValue = (value: string) => {
    onChange(selected, value, false);
  };

  return (
    <div className="pf-c-input-group">
      <Dropdown
        onSelect={onSelect}
        toggle={
          <DropdownToggle id="toggle-id" onToggle={onToggle} toggleIndicator={CaretDownIcon}>
            <>
              <FilterIcon className="span--icon__right-margin" /> {selected}
            </>
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems}
      />
      <TextFilter
        parentClassName="co-search__filter-input"
        onChange={handleInputValue}
        placeholder={selected === searchFilterValues.Label ? 'app=frontend' : 'my-resource'}
        name="search-filter-input"
        id="search-filter-input"
        value={selected === searchFilterValues.Label ? labelFilterInput : nameFilterInput}
        onKeyDown={handleKeyDown}
        aria-labelledby="toggle-id"
      />
    </div>
  );
};

export type SearchFilterDropdownProps = {
  onChange: (type: string, value: string, endOfString: boolean) => void;
  nameFilterInput: string;
  labelFilterInput: string;
};
