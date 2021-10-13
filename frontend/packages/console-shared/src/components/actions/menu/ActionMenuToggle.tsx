import * as React from 'react';
import { MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ActionMenuVariant } from '../types';

type ActionMenuToggleProps = {
  isOpen: boolean;
  isDisabled: boolean;
  menuRef: React.RefObject<HTMLElement>;
  toggleRef: React.RefObject<HTMLButtonElement>;
  toggleVariant?: ActionMenuVariant;
  toggleTitle?: string;
  onToggleClick: (state: React.SetStateAction<boolean>) => void;
  onToggleHover: () => void;
};

const ActionMenuToggle: React.FC<ActionMenuToggleProps> = ({
  isOpen,
  isDisabled,
  menuRef,
  toggleRef,
  toggleVariant = ActionMenuVariant.KEBAB,
  toggleTitle,
  onToggleClick,
  onToggleHover,
}) => {
  const { t } = useTranslation();
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
    if (isOpen && !menuRef.current?.contains(event.target)) {
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

  return (
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
};

export default ActionMenuToggle;
