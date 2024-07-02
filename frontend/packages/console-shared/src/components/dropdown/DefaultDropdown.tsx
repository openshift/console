import * as React from 'react';
import {
  MenuToggle as PFMenuToggle,
  MenuToggleElement as PFMenuToggleElement,
  Dropdown as PFDropdown,
  DropdownList as PFDropdownList,
} from '@patternfly/react-core';

const Dropdown: React.FC<DropdownProps> = ({ dropdownItems, id, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  return (
    <PFDropdown
      onSelect={onSelect}
      isOpen={isOpen}
      id={id}
      onOpenChange={(isDropdownOpen: boolean) => setIsOpen(isDropdownOpen)}
      toggle={(toggleRef: React.Ref<PFMenuToggleElement>) => (
        <PFMenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
          {children}
        </PFMenuToggle>
      )}
    >
      <PFDropdownList>{dropdownItems}</PFDropdownList>
    </PFDropdown>
  );
};

type DropdownProps = {
  dropdownItems: any[];
  id: string;
};

export default Dropdown;
