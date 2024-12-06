import * as React from 'react';
import { Dropdown, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import { useBoolean } from './hooks/useBoolean';

const KebabDropdown: React.FC<{ dropdownItems: any[] }> = ({ dropdownItems }) => {
  const [isOpen, setIsOpen, setOpen, setClosed] = useBoolean(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={setClosed}
      onOpenChange={(open: boolean) => (open ? setOpen() : setClosed())}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="toggle menu"
          data-test-id="kebab-button"
          variant="plain"
          onClick={setIsOpen}
          isExpanded={isOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default KebabDropdown;
