import type { FC, ReactElement, RefObject } from 'react';
import { useRef, useEffect } from 'react';
import { MenuToggle, Popper } from '@patternfly/react-core';

const DropdownWithSwitchToggle: FC<DropdownWithSwitchToggleProps> = ({
  isDisabled,
  isFullWidth,
  isOpen,
  label,
  menu,
  menuRef,
  onToggle,
}) => {
  const toggleRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
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
        popper={<>{menu}</>} // fragment is necessary to avoid a bug in PatternFly v5 Popper
        position="left"
        trigger={
          <MenuToggle
            isDisabled={isDisabled}
            isFullWidth={isFullWidth}
            isExpanded={isOpen}
            onClick={() => onToggle(!isOpen)}
            ref={toggleRef}
            data-test="dropdown-with-switch-toggle"
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
  menu: ReactElement;
  menuRef: RefObject<HTMLElement>;
  onToggle: (state: boolean) => void;
};

export default DropdownWithSwitchToggle;
