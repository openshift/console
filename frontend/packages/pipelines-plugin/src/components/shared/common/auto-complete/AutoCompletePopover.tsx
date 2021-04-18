import * as React from 'react';
import { Menu, MenuList, MenuItem } from '@patternfly/react-core';
import Popper from '@console/shared/src/components/popper/Popper';
import useAutoComplete from './useAutoComplete';

type AutoCompletePopoverProps = {
  autoCompleteValues: string[];
  children: (contentRef) => React.ReactNode;
  onAutoComplete: (newValue: string) => void;
};

const AutoCompletePopover: React.FC<AutoCompletePopoverProps> = ({
  autoCompleteValues,
  children,
  onAutoComplete,
}) => {
  const { contentRef, popperProps, options, insertAutoComplete } = useAutoComplete(
    autoCompleteValues,
    onAutoComplete,
  );

  return (
    <>
      {children(contentRef)}
      <Popper placement="bottom-start" closeOnEsc closeOnOutsideClick {...popperProps}>
        <Menu onSelect={(event, itemId: number) => insertAutoComplete(options[itemId])}>
          <MenuList translate="no">
            {options.map((value, idx) => (
              <MenuItem key={value} itemId={idx} translate="no">
                {value}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Popper>
    </>
  );
};

export default AutoCompletePopover;
