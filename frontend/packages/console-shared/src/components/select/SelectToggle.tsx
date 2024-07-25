import * as React from 'react';
import { MenuToggle, MenuToggleProps } from '@patternfly/react-core';

const SelectToggle: React.FC<SelectToggleProps> = (props) => <MenuToggle {...props} />;

type SelectToggleProps = Partial<MenuToggleProps> & {
  children?: React.ReactNode;
};

export default SelectToggle;
