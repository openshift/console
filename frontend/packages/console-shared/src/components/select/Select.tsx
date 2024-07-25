import * as React from 'react';
import {
  Select as PFSelect,
  SelectList,
  SelectProps as PFSelectProps,
  MenuToggleElement,
} from '@patternfly/react-core';

const Select: React.FC<SelectProps> = ({ selectItems, toggle, children, ...props }) => {
  const pfToggle = React.useCallback(
    (innerRef: React.RefObject<MenuToggleElement>) => React.cloneElement(toggle, { innerRef }),
    [toggle],
  );
  return (
    <PFSelect {...props} toggle={pfToggle}>
      {selectItems ? <SelectList>{selectItems}</SelectList> : children}
    </PFSelect>
  );
};

type SelectProps = {
  id?: string;
  selectItems?: React.ReactNode[];
  toggle: React.ReactElement;
} & Omit<PFSelectProps, 'toggle'>;

export default Select;
