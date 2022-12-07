import { Dropdown, DropdownPosition, KebabToggle } from '@patternfly/react-core';
import * as React from 'react';

import { useBoolean } from './hooks/useBoolean';

const KebabDropdown: React.FC<{ dropdownItems: any[] }> = ({ dropdownItems }) => {
  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);

  return (
    <Dropdown
      data-test-id="kebab-button"
      dropdownItems={dropdownItems}
      isOpen={isOpen}
      isPlain
      onSelect={setClosed}
      position={DropdownPosition.right}
      toggle={<KebabToggle aria-label="toggle menu" onToggle={setIsOpen} />}
    />
  );
};

export default KebabDropdown;
