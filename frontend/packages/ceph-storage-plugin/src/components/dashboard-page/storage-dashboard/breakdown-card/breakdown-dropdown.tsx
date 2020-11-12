import * as React from 'react';
import {
  SelectOption,
  SelectGroup,
  OptionsMenuItemGroup,
  OptionsMenuItem,
} from '@patternfly/react-core';

type GroupedSelectItems = {
  group: string;
  items: { name: string; id: string }[];
}[];

export const getSelectOptions = (
  selectItems: { name: string; id: string }[],
): React.ReactElement[] =>
  selectItems.map(({ id, name }) => (
    <SelectOption key={id} value={id}>
      {name}
    </SelectOption>
  ));

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
          isSelected={selectedItems.includes(item.id)}
          id={item.id}
          key={item.id}
        >
          {item.name}
        </OptionsMenuItem>
      ))}
    </OptionsMenuItemGroup>
  ));
};
