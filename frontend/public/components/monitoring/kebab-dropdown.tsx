import {
  Dropdown as DropdownDeprecated,
  DropdownPosition as DropdownPositionDeprecated,
  KebabToggle as KebabToggleDeprecated,
} from '@patternfly/react-core/deprecated';
import * as React from 'react';

import { useBoolean } from './hooks/useBoolean';

const KebabDropdown: React.FC<{ dropdownItems: any[] }> = ({ dropdownItems }) => {
  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);

  return (
    <DropdownDeprecated
      data-test-id="kebab-button"
      dropdownItems={dropdownItems}
      isOpen={isOpen}
      isPlain
      onSelect={setClosed}
      position={DropdownPositionDeprecated.right}
      toggle={<KebabToggleDeprecated aria-label="toggle menu" onToggle={setIsOpen} />}
    />
  );
};

export default KebabDropdown;
