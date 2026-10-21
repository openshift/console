import type { FC, ComponentProps } from 'react';
import { useRef, useState, useCallback } from 'react';
import DropdownWithSwitchMenu from './DropdownWithSwitchMenu';
import DropdownWithSwitchToggle from './DropdownWithSwitchToggle';

export const DropdownWithSwitch: FC<DropdownWithSwitchProps> = ({
  isDisabled,
  isFullWidth,
  toggleLabel,
  ...dropdownWithSwitchMenuProps
}) => {
  const menuRef = useRef(null);
  const [isOpen, setOpen] = useState(false);
  const switchMenuProps: ComponentProps<typeof DropdownWithSwitchMenu> = {
    ...dropdownWithSwitchMenuProps,
    menuRef,
    setOpen,
  };
  const onToggle = useCallback((menuState: boolean) => {
    setOpen(menuState);
  }, []);

  return (
    <DropdownWithSwitchToggle
      isDisabled={isDisabled}
      isFullWidth={isFullWidth}
      label={toggleLabel}
      menu={<DropdownWithSwitchMenu {...switchMenuProps} />}
      menuRef={menuRef}
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
};

type DropdownWithSwitchProps = Omit<
  ComponentProps<typeof DropdownWithSwitchMenu>,
  'menuRef' | 'setOpen'
> & {
  isDisabled?: boolean;
  isFullWidth?: boolean;
  toggleLabel: string;
};
