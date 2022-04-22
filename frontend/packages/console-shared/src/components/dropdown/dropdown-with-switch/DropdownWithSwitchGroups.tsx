import * as React from 'react';
import { Divider, MenuGroup, MenuItem, MenuList } from '@patternfly/react-core';

const DropdownWithSwitchGroups: React.FC<DropdownWithSwitchGroupsProps> = ({
  options,
  selectedKey,
}) => {
  const renderedOptions = options.filter(({ items }) => items.length > 0);
  return renderedOptions.length === 0 ? null : (
    <>
      {renderedOptions.map(({ items, key, label }, i) => (
        <React.Fragment key={key}>
          {i !== 0 && <Divider />}
          <MenuGroup label={label} translate="no">
            <MenuList>
              {items.map(({ isDisabled, key: iKey, title }) => (
                <MenuItem
                  itemId={iKey}
                  isDisabled={isDisabled}
                  isSelected={selectedKey === iKey}
                  key={iKey}
                  translate="no"
                >
                  {title}
                </MenuItem>
              ))}
            </MenuList>
          </MenuGroup>
        </React.Fragment>
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
