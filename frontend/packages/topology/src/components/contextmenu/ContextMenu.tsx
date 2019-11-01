import * as React from 'react';
import {
  DropdownMenu,
  DropdownItem,
  DropdownContext,
  DropdownSeparator,
} from '@patternfly/react-core';
import styles from '@patternfly/react-styles/css/components/Dropdown/dropdown';
import Popper from './Popper';

import './ContextMenu.scss';

type ContextMenuProps = Pick<
  React.ComponentProps<typeof Popper>,
  'container' | 'className' | 'open' | 'reference' | 'onRequestClose'
>;

const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  open = true,
  onRequestClose,
  ...other
}) => {
  const [isOpen, setOpen] = React.useState(!!open);
  React.useEffect(() => {
    setOpen(open);
  }, [open]);

  const handleOnRequestClose = React.useCallback(() => {
    onRequestClose ? onRequestClose() : setOpen(false);
  }, [onRequestClose]);

  return (
    <Popper
      {...other}
      closeOnEsc
      closeOnOutsideClick
      open={isOpen}
      onRequestClose={handleOnRequestClose}
    >
      <DropdownContext.Provider
        value={{
          onSelect: handleOnRequestClose,
          toggleTextClass: styles.dropdownToggleText,
          toggleIconClass: styles.dropdownToggleIcon,
          menuClass: styles.dropdownMenu,
          itemClass: styles.dropdownMenuItem,
          toggleClass: styles.dropdownToggle,
          baseClass: styles.dropdown,
          baseComponent: 'div',
          sectionClass: styles.dropdownGroup,
          sectionTitleClass: styles.dropdownGroupTitle,
          sectionComponent: 'section',
          disabledClass: styles.modifiers.disabled,
          hoverClass: styles.modifiers.hover,
          separatorClass: styles.dropdownSeparator,
        }}
      >
        <div className="pf-c-dropdown pf-m-expanded">
          <DropdownMenu className="pf-c-dropdown__menu topology-context-menu" autoFocus>
            {children}
          </DropdownMenu>
        </div>
      </DropdownContext.Provider>
    </Popper>
  );
};

export default ContextMenu;

// re-export dropdown components as context menu components
export const ContextMenuSeparator = DropdownSeparator;
export const ContextMenuItem = DropdownItem;
