import type { FC, MouseEvent, MutableRefObject, ReactNode } from 'react';
import {
  Divider,
  Menu,
  MenuContent,
  MenuSearch,
  Switch,
  MenuSearchInput,
} from '@patternfly/react-core';
import type { DropdownWithSwitchGroup } from './DropdownWithSwitchGroups';
import DropdownWithSwitchGroups from './DropdownWithSwitchGroups';

const DropdownWithSwitchMenu: FC<DropdownWithSwitchMenuProps> = ({
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
  switchOnChange,
}) => {
  return (
    <Menu
      activeItemId={selected}
      isScrollable
      onSelect={(event: MouseEvent, itemId: string) => {
        onSelect(event, itemId);
        setOpen(false);
      }}
      ref={menuRef}
      style={{ position: 'absolute', zIndex: 100 }}
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
              onChange={(_event, value) => switchOnChange(value)}
              data-test="dropdown-with-switch-switch"
            />
          </MenuSearchInput>
        </MenuSearch>
        <Divider />
        <DropdownWithSwitchGroups options={options} selectedKey={selected} />
      </MenuContent>
    </Menu>
  );
};

type DropdownWithSwitchMenuProps = {
  menuRef: MutableRefObject<HTMLDivElement>;
  onSelect: (event: MouseEvent, itemId: string) => void;
  options: DropdownWithSwitchGroup[];
  selected?: string;
  setOpen: (isOpen: boolean) => void;
  switchIsChecked: boolean;
  switchIsDisabled?: boolean;
  switchLabelIsReversed?: boolean;
  switchLabel?: ReactNode;
  switchLabelClassName?: string;
  switchLabelOff?: ReactNode;
  switchOnChange: (isChecked: boolean) => void;
};

export default DropdownWithSwitchMenu;
