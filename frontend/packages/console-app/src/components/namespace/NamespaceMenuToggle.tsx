import * as React from 'react';
import { MenuToggle, Popper } from '@patternfly/react-core';

const NamespaceMenuToggle = (props: {
  disabled: boolean;
  menu: React.ReactElement;
  isOpen: boolean;
  shortCut?: string;
  title: string;
  onToggle: (state: boolean) => void;
}) => {
  const { menu, isOpen, shortCut, title, onToggle, disabled } = props;

  const toggleRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const inMenuItem = (event): boolean => {
    let classList = event.target.classList ? [...event.target.classList] : [];
    if (event?.target?.parentNode?.parentNode?.classList) {
      // This is to grab items in the menu like the favorite star button applied by PatternFly
      classList = classList.concat([...event.target.parentNode.parentNode.classList]);
    }
    return classList.some(
      (c) =>
        /pf-c-menu.*/.test(c) ||
        /co-namespace-project-selector.*/.test(c) ||
        /pf-c-switch__toggle.*/.test(c) ||
        /pf-c-switch__input.*/.test(c),
    );
  };

  const handleMenuKeys = (event) => {
    if (
      shortCut &&
      event.key === shortCut &&
      event.target.nodeName !== 'INPUT' &&
      event.target.nodeName !== 'TEXTAREA'
    ) {
      onToggle(true);
      event.stopPropagation();
      event.preventDefault();
    }

    if (inMenuItem(event)) {
      if (event.key === 'Escape') {
        onToggle(false);
        toggleRef.current.focus();
      }
    }
    if (!inMenuItem(event)) {
      if (event.key === 'Tab') {
        onToggle(false);
      }
    }
  };

  const handleMenuClick = (event) => {
    if (!inMenuItem(event)) {
      onToggle(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleMenuClick);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
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
      className="co-namespace-selector__menu-toggle"
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
      />
    </div>
  );
};

export default NamespaceMenuToggle;
