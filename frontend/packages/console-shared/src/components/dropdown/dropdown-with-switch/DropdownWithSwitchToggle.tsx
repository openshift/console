import * as React from 'react';
import { MenuToggle, Popper } from '@patternfly/react-core';

const DropdownWithSwitchToggle: React.FC<DropdownWithSwitchToggleProps> = ({
  isDisabled,
  isFullWidth,
  isOpen,
  label,
  menu,
  menuRef,
  onToggle,
}) => {
  const toggleRef = React.useRef(null);
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    const handleMenuKeys = (event: KeyboardEvent) => {
      if (
        event.key === 'Tab' &&
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        onToggle(false);
      }
    };
    const handleMenuClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target) &&
        !toggleRef.current.contains(event.target)
      ) {
        onToggle(false);
      }
    };
    window.addEventListener('keyup', handleMenuKeys);
    window.addEventListener('click', handleMenuClick);
    return () => {
      window.removeEventListener('keyup', handleMenuKeys);
      window.removeEventListener('click', handleMenuClick);
    };
  }, [menuRef, onToggle]);

  return (
    <div ref={containerRef}>
      <Popper
        appendTo={containerRef.current}
        direction="down"
        enableFlip={false}
        isVisible={isOpen}
        popper={menu}
        popperMatchesTriggerWidth
        position="left"
        trigger={
          <MenuToggle
            isDisabled={isDisabled}
            isFullWidth={isFullWidth}
            isExpanded={isOpen}
            onClick={() => onToggle(!isOpen)}
            ref={toggleRef}
          >
            {label}
          </MenuToggle>
        }
      />
    </div>
  );
};

type DropdownWithSwitchToggleProps = {
  isDisabled?: boolean;
  isFullWidth?: boolean;
  isOpen: boolean;
  label: string;
  menu: React.ReactElement;
  menuRef: React.RefObject<HTMLElement>;
  onToggle: (state: boolean) => void;
};

export default DropdownWithSwitchToggle;
