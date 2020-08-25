import * as React from 'react';
import {
  SelectOption,
  SelectGroup,
  OptionsMenuItemGroup,
  OptionsMenuItem,
} from '@patternfly/react-core';

type GroupedSelectItems = {
  group: string;
  items: string[];
}[];

export const getSelectOptions = (selectItems: string[]): React.ReactElement[] =>
  selectItems.map((item) => <SelectOption key={item} value={item} />);

export const getGroupedSelectOptions = (
  groupedSelectItems: GroupedSelectItems,
): React.ReactElement[] =>
  groupedSelectItems.map(({ group, items }) => (
    <SelectGroup key={group} label={group}>
      {getSelectOptions(items)}
    </SelectGroup>
  ));

export const getOptionsMenuItems = (
  dropdownItems: GroupedSelectItems,
  selectedItems: string[],
  onSelect: (e) => void,
) => {
  return dropdownItems.map(({ group, items }) => (
    <OptionsMenuItemGroup
      className="nb-data-consumption-card__dropdown-item--hide-list-style"
      key={group}
      groupTitle={group}
    >
      {items.map((item) => (
        <OptionsMenuItem
          onSelect={onSelect}
          isSelected={selectedItems.includes(item)}
          id={item}
          key={item}
        >
          {item}
        </OptionsMenuItem>
      ))}
    </OptionsMenuItemGroup>
  ));
};
