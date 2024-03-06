import * as React from 'react';
import {
  Divider,
  Menu,
  MenuContent,
  MenuSearch,
  MenuItem,
  MenuList,
  Switch,
  MenuSearchInput,
} from '@patternfly/react-core';
import DropdownWithSwitchGroups, { DropdownWithSwitchGroup } from './DropdownWithSwitchGroups';

const DropdownWithSwitchMenu: React.FC<DropdownWithSwitchMenuProps> = ({
  menuRef,
  onSelect,
  options,
  selected,
  setOpen,
  switchIsChecked,
  switchIsDisabled,
  switchLabel,
  switchLabelClassName,
  switchLabelIsReversed,
  switchLabelOff,
  switchOnChange,
}) => {
  return (
    <Menu
      activeItemId={selected}
      isScrollable
      onSelect={(event: React.MouseEvent, itemId: string) => {
        onSelect(event, itemId);
        setOpen(false);
      }}
      ref={menuRef}
      style={{ position: 'absolute' }}
    >
      <MenuContent>
        <MenuSearch>
          <MenuSearchInput>
            <Switch
              className={switchLabelClassName}
              isChecked={switchIsChecked}
              isDisabled={switchIsDisabled}
              isReversed={switchLabelIsReversed}
              label={switchLabel}
              labelOff={switchLabelOff}
              onChange={(_event, value) => switchOnChange(value)}
              data-test="dropdown-with-switch-switch"
            />
          </MenuSearchInput>
        </MenuSearch>
        <Divider />
        {/* PatternFly expects Menu to contain a MenuList with a MenuItem
        see https://github.com/patternfly/patternfly-react/issues/7365
        hack to workaround this bug by adding a hidden MenuList */}
        <MenuList className="pf-v5-u-display-none">
          <MenuItem> </MenuItem>
        </MenuList>
        <DropdownWithSwitchGroups options={options} selectedKey={selected} />
      </MenuContent>
    </Menu>
  );
};

type DropdownWithSwitchMenuProps = {
  menuRef: React.MutableRefObject<HTMLDivElement>;
  onSelect: (event: React.MouseEvent, itemId: string) => void;
  options: DropdownWithSwitchGroup[];
  selected?: string;
  setOpen: (isOpen: boolean) => void;
  switchIsChecked: boolean;
  switchIsDisabled?: boolean;
  switchLabelIsReversed?: boolean;
  switchLabel?: React.ReactNode;
  switchLabelClassName?: string;
  switchLabelOff?: React.ReactNode;
  switchOnChange: (isChecked: boolean) => void;
};

export default DropdownWithSwitchMenu;
