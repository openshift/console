import * as React from 'react';
import { MenuToggle, Popper } from '@patternfly/react-core';

const ClusterMenuToggle = (props: {
  disabled: boolean;
  menu: React.ReactElement;
  menuRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  title: string | JSX.Element;
  onToggle: (state: boolean) => void;
}) => {
  const { disabled, menu, isOpen, menuRef, onToggle, title } = props;

  const toggleRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const handleMenuKeys = (event) => {
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
      !toggleRef.current.contains(event.target)
    ) {
      onToggle(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keyup', handleMenuKeys);
    window.addEventListener('click', handleMenuClick);
    return () => {
      window.removeEventListener('keyup', handleMenuKeys);
      window.removeEventListener('click', handleMenuClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This needs to be run only on component mount/unmount

  const menuToggle = (
    <MenuToggle
      ref={toggleRef}
      onClick={() => onToggle(!isOpen)}
      isExpanded={isOpen}
      variant="plainText"
      isFullWidth
      disabled={disabled}
      className="co-cluster-selector"
      data-test-id="cluster-dropdown-toggle"
    >
      {title}
    </MenuToggle>
  );

  return (
    <div ref={containerRef}>
      <Popper
        trigger={menuToggle}
        popper={menu}
        direction="down"
        position="left"
        appendTo={() => document.body}
        isVisible={isOpen}
        popperMatchesTriggerWidth={false}
        enableFlip={false}
      />
    </div>
  );
};

export default ClusterMenuToggle;
