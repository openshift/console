import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { CaretDownIcon, FilterIcon } from '@patternfly/react-icons';
import { TextFilter } from './factory';
import { useTranslation } from 'react-i18next';

export enum searchFilterValues {
  Label = 'Label',
  Name = 'Name',
}

export const SearchFilterDropdown: React.SFC<SearchFilterDropdownProps> = props => {
  const [isOpen, setOpen] = React.useState(false);
  const { t } = useTranslation();
  const LABEL = t('COMMON:MSG_COMMON_SEARCH_FILTER_2');
  const NAME = t('COMMON:MSG_COMMON_SEARCH_FILTER_1');
  const [selected, setSelected] = React.useState(LABEL);

  React.useEffect(() => {
    // 언어 변경시에 dropdown title이 변경이 안되서 넣어둠.
    if (selected === LABEL) {
      setSelected(LABEL);
    } else {
      setSelected(NAME);
    }
  }, [LABEL, NAME]);

  const { onChange, nameFilterInput, labelFilterInput } = props;

  const onToggle = (open: boolean) => setOpen(open);
  const onSelect = event => {
    const selectedName = event.target.name;
    setSelected(selectedName);
    setOpen(!isOpen);
  };
  const dropdownItems = [
    <DropdownItem key="label-action" name={t('COMMON:MSG_COMMON_SEARCH_FILTER_2')} component="button">
      {t('COMMON:MSG_COMMON_SEARCH_FILTER_2')}
    </DropdownItem>,
    <DropdownItem key="name-action" name={t('COMMON:MSG_COMMON_SEARCH_FILTER_1')} component="button">
      {t('COMMON:MSG_COMMON_SEARCH_FILTER_1')}
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
          <DropdownToggle id="toggle-id" onToggle={onToggle} iconComponent={CaretDownIcon}>
            <>
              <FilterIcon className="span--icon__right-margin" /> {selected}
            </>
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems}
      />
      <TextFilter parentClassName="co-search__filter-input" onChange={handleInputValue} placeholder={selected === t('COMMON:MSG_COMMON_SEARCH_FILTER_2') ? 'app=frontend' : 'my-resource'} name="search-filter-input" id="search-filter-input" value={selected === t('COMMON:MSG_COMMON_SEARCH_FILTER_2') ? labelFilterInput : nameFilterInput} onKeyDown={handleKeyDown} aria-labelledby="toggle-id" />
    </div>
  );
};

export type SearchFilterDropdownProps = {
  onChange: (type: string, value: string, endOfString: boolean) => void;
  nameFilterInput: string;
  labelFilterInput: string;
};
