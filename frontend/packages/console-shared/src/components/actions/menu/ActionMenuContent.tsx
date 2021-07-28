import * as React from 'react';
import {
  FocusTrap,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuItemAction,
  MenuList,
} from '@patternfly/react-core';
import { AngleRightIcon } from '@patternfly/react-icons';
import { Action } from '@console/dynamic-plugin-sdk';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';
import { Popper } from '../../popper';
import { GroupedMenuOption, MenuOption, MenuOptionType } from '../types';
import { getMenuOptionType } from '../utils';
import ActionMenuItem from './ActionMenuItem';

type GroupMenuContentProps = {
  option: GroupedMenuOption;
  onClick: () => void;
};

const GroupMenuContent: React.FC<GroupMenuContentProps> = ({ option, onClick }) => (
  <MenuGroup label={option.label} translate="no">
    <ActionMenuContent options={option.children} onClick={onClick} focusItem={option.children[0]} />
  </MenuGroup>
);

// Need to keep this in the same file to avoid circular dependency.
const SubMenuContent: React.FC<GroupMenuContentProps> = ({ option, onClick }) => {
  const [open, setOpen] = React.useState(false);
  const nodeRef = React.useRef(null);
  const nodeRefCb = React.useCallback(() => nodeRef.current, []);
  const subMenuRef = React.useRef(null);
  // use a callback ref because FocusTrap is old and doesn't support non-function refs
  const subMenuRefCb = React.useCallback(() => subMenuRef.current, []);

  // mouse enter will open the sub menu
  const handleNodeMouseEnter = () => setOpen(true);

  const handleNodeMouseLeave = (e) => {
    // if the mouse leaves this item, close the sub menu only if the mouse did not enter the sub menu itself
    if (!subMenuRef.current || !subMenuRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  const handleNodeKeyDown = (e) => {
    // open the sub menu on enter or right arrow
    if (e.keyCode === 39 || e.keyCode === 13) {
      setOpen(true);
      e.stopPropagation();
    }
  };

  const handlePopperRequestClose = (e) => {
    // only close the sub menu if clicking anywhere outside the menu item that owns the sub menu
    if (!e || !nodeRef.current || !nodeRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  const handleMenuMouseLeave = (e) => {
    // only close the sub menu if the mouse does not enter the item
    if (!nodeRef.current || !nodeRef.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  const handleMenuKeyDown = (e) => {
    // close the sub menu on left arrow
    if (e.keyCode === 37) {
      setOpen(false);
      e.stopPropagation();
    }
  };

  return (
    <>
      <MenuItem
        ref={nodeRef}
        actions={<MenuItemAction icon={<AngleRightIcon aria-hidden />} />}
        onMouseEnter={handleNodeMouseEnter}
        onMouseLeave={handleNodeMouseLeave}
        onKeyDown={handleNodeKeyDown}
        data-test-action={option.id}
        tabIndex={0}
        translate="no"
      >
        {option.label}
      </MenuItem>
      <Popper
        open={open}
        placement="right-start"
        reference={nodeRefCb}
        onRequestClose={handlePopperRequestClose}
        closeOnEsc
        closeOnOutsideClick
      >
        <FocusTrap
          focusTrapOptions={{ clickOutsideDeactivates: true, fallbackFocus: subMenuRefCb }}
        >
          <div
            ref={subMenuRef}
            role="presentation"
            className="pf-c-menu pf-m-flyout"
            onMouseLeave={handleMenuMouseLeave}
            onKeyDown={handleMenuKeyDown}
          >
            <ActionMenuContent
              options={option.children}
              onClick={onClick}
              focusItem={option.children[0]}
            />
          </div>
        </FocusTrap>
      </Popper>
    </>
  );
};

type ActionMenuContentProps = {
  options: MenuOption[];
  onClick: () => void;
  focusItem?: MenuOption;
};

const ActionMenuContent: React.FC<ActionMenuContentProps> = ({ options, onClick, focusItem }) => {
  const sortedOptions = orderExtensionBasedOnInsertBeforeAndAfter(options);
  return (
    <MenuContent data-test-id="action-items" translate="no">
      <MenuList translate="no">
        {sortedOptions.map((option) => {
          const optionType = getMenuOptionType(option);
          switch (optionType) {
            case MenuOptionType.SUB_MENU:
              return (
                <SubMenuContent
                  key={option.id}
                  option={option as GroupedMenuOption}
                  onClick={onClick}
                />
              );
            case MenuOptionType.GROUP_MENU:
              return (
                <GroupMenuContent
                  key={option.id}
                  option={option as GroupedMenuOption}
                  onClick={onClick}
                />
              );
            default:
              return (
                <ActionMenuItem
                  key={option.id}
                  action={option as Action}
                  onClick={onClick}
                  autoFocus={focusItem ? option === focusItem : undefined}
                />
              );
          }
        })}
      </MenuList>
    </MenuContent>
  );
};

export default ActionMenuContent;
