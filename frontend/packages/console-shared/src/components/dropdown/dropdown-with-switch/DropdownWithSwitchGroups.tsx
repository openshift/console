import type { FC } from 'react';
import { Fragment } from 'react';
import { Divider, MenuGroup, MenuItem, MenuList } from '@patternfly/react-core';

const DropdownWithSwitchGroups: FC<DropdownWithSwitchGroupsProps> = ({ options, selectedKey }) => {
  const renderedOptions = options.filter(({ items }) => items.length > 0);
  return renderedOptions.length === 0 ? null : (
    <>
      {renderedOptions.map(({ items, key, label }, i) => (
        <Fragment key={key}>
          {i !== 0 && <Divider />}
          <MenuGroup label={label}>
            <MenuList>
              {items.map(({ isDisabled, key: iKey, title }) => (
                <MenuItem
                  itemId={iKey}
                  isDisabled={isDisabled}
                  isSelected={selectedKey === iKey}
                  key={iKey}
                  data-test={`dropdown-with-switch-menu-item-${iKey}`}
                >
                  {title}
                </MenuItem>
              ))}
            </MenuList>
          </MenuGroup>
        </Fragment>
      ))}
    </>
  );
};

export type DropdownWithSwitchGroup = {
  items: {
    isDisabled: boolean;
    key: string;
    title: string;
  }[];
  key: string;
  label?: string;
};

type DropdownWithSwitchGroupsProps = {
  options: DropdownWithSwitchGroup[];
  selectedKey: string;
};

export default DropdownWithSwitchGroups;
