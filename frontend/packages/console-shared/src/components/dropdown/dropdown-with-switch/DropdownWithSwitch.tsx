import * as React from 'react';
import DropdownWithSwitchMenu from './DropdownWithSwitchMenu';
import DropdownWithSwitchToggle from './DropdownWithSwitchToggle';

const DropdownWithSwitch: React.FC<DropdownWithSwitchProps> = ({
  isDisabled,
  isFullWidth,
  toggleLabel,
  ...dropdownWithSwitchMenuProps
}) => {
  const menuRef = React.useRef(null);
  const [isOpen, setOpen] = React.useState(false);
  const switchMenuProps: React.ComponentProps<typeof DropdownWithSwitchMenu> = {
    ...dropdownWithSwitchMenuProps,
    menuRef,
    setOpen,
  };
  const onToggle = React.useCallback((menuState: boolean) => {
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
  React.ComponentProps<typeof DropdownWithSwitchMenu>,
  'menuRef' | 'setOpen'
> & {
  isDisabled?: boolean;
  isFullWidth?: boolean;
  toggleLabel: string;
};

export default DropdownWithSwitch;
