import * as React from 'react';
import { Popper, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ActionMenuVariant } from '../types';

type ActionMenuRendererProps = {
  isOpen: boolean;
  isDisabled: boolean;
  menu: React.ReactElement;
  menuRef: React.RefObject<HTMLElement>;
  toggleVariant?: ActionMenuVariant;
  toggleTitle?: string;
  onToggleClick: (state: React.SetStateAction<boolean>) => void;
  onToggleHover: () => void;
};

const ActionMenuRenderer: React.FC<ActionMenuRendererProps> = ({
  isOpen,
  isDisabled,
  menu,
  menuRef,
  toggleVariant = ActionMenuVariant.KEBAB,
  toggleTitle,
  onToggleClick,
  onToggleHover,
}) => {
  const { t } = useTranslation();
  const toggleRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const isKebabVariant = toggleVariant === ActionMenuVariant.KEBAB;
  const toggleLabel = toggleTitle || t('console-shared~Actions');

  const handleMenuKeys = (event) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current) {
      if (event.key === 'Escape') {
        onToggleClick(false);
        toggleRef.current.focus();
      }
      if (!menuRef.current?.contains(event.target) && event.key === 'Tab') {
        onToggleClick(false);
      }
    }
  };

  const handleClickOutside = (event) => {
    if (isOpen && !menuRef.current.contains(event.target)) {
      onToggleClick(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // This needs to be run only on component mount/unmount

  const handleToggleClick = (ev) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      const firstElement = menuRef?.current?.querySelector<HTMLElement>(
        'li > button:not(:disabled)',
      );
      firstElement?.focus();
    }, 0);
    onToggleClick((open) => !open);
  };

  const toggle = (
    <MenuToggle
      variant={toggleVariant}
      innerRef={toggleRef}
      isExpanded={isOpen}
      isDisabled={isDisabled}
      aria-expanded={isOpen}
      aria-label={toggleLabel}
      aria-haspopup="true"
      data-test-id={isKebabVariant ? 'kebab-button' : 'actions-menu-button'}
      onClick={handleToggleClick}
      {...(isKebabVariant ? { onFocus: onToggleHover, onMouseEnter: onToggleHover } : {})}
    >
      {isKebabVariant ? <EllipsisVIcon /> : toggleLabel}
    </MenuToggle>
  );

  return (
    <div ref={containerRef}>
      <Popper
        trigger={toggle}
        popper={menu}
        placement="bottom-end"
        isVisible={isOpen}
        appendTo={containerRef.current}
        popperMatchesTriggerWidth={false}
      />
    </div>
  );
};

export default ActionMenuRenderer;
