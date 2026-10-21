import type { ReactElement, RefObject } from 'react';
import { useRef, useEffect } from 'react';
import { MenuToggle, Popper } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

const NamespaceMenuToggle = (props: {
  disabled: boolean;
  menu: ReactElement;
  menuRef: RefObject<HTMLElement>;
  isOpen: boolean;
  shortCut?: string;
  title: string;
  onToggle: (state: boolean) => void;
  className?: string;
}) => {
  const { menu, isOpen, shortCut, title, onToggle, disabled, menuRef, className } = props;

  const toggleRef = useRef(null);
  const containerRef = useRef(null);

  const handleMenuKeys = (event) => {
    if (
      shortCut &&
      event.key === shortCut &&
      event.target.nodeName !== 'INPUT' &&
      event.target.nodeName !== 'TEXTAREA' &&
      event.target.role !== 'textbox' &&
      event.target.role !== 'code'
    ) {
      onToggle(true);
      event.stopPropagation();
      event.preventDefault();
    }

    if (menuRef.current) {
      if (event.key === 'Escape') {
        onToggle(false);
        toggleRef.current.focus();
      }
      if (!menuRef.current?.contains(event.target) && event.key === 'Tab') {
        onToggle(false);
      }
    }
  };

  const handleMenuClick = (event) => {
    if (
      menuRef.current &&
      !menuRef.current?.contains(event.target) &&
      // Checking to see if user clicked on a favorite icon.  This is needed because
      // if unfavoriting a item, PF removes the item from the DOM before
      // the click event is registered
      !event.target.closest?.('.pf-m-favorite') &&
      !toggleRef.current.contains(event.target)
    ) {
      onToggle(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keyup', handleMenuKeys);
    window.addEventListener('click', handleMenuClick);
    return () => {
      window.removeEventListener('keyup', handleMenuKeys);
      window.removeEventListener('click', handleMenuClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This needs to be run only on component mount/unmount

  const toggle = (
    <MenuToggle
      ref={toggleRef}
      onClick={() => onToggle(!isOpen)}
      isExpanded={isOpen}
      disabled={disabled}
      className={css('co-namespace-dropdown__menu-toggle', className)}
    >
      {title}
    </MenuToggle>
  );

  return (
    <div ref={containerRef}>
      <Popper
        trigger={toggle}
        popper={menu}
        direction="down"
        position="left"
        appendTo={containerRef.current}
        isVisible={isOpen}
        enableFlip={false}
      />
    </div>
  );
};

export default NamespaceMenuToggle;
