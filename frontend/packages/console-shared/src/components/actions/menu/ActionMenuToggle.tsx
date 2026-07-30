import type { RefObject, SetStateAction, FC } from 'react';
import { useEffect } from 'react';
import { MenuToggle } from '@patternfly/react-core';
import { RhUiEllipsisVerticalIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ActionMenuVariant } from '../types';

type ActionMenuToggleProps = {
  isOpen: boolean;
  isDisabled: boolean;
  menuRef: RefObject<HTMLElement>;
  toggleRef: RefObject<HTMLButtonElement>;
  toggleVariant?: ActionMenuVariant;
  toggleTitle?: string;
  onToggleClick: (state: SetStateAction<boolean>) => void;
  onToggleHover: () => void;
};

const ActionMenuToggle: FC<ActionMenuToggleProps> = ({
  isOpen,
  isDisabled,
  menuRef,
  toggleRef,
  toggleVariant = ActionMenuVariant.KEBAB,
  toggleTitle,
  onToggleClick,
  onToggleHover,
}) => {
  const { t } = useTranslation('console-shared');
  const isKebabVariant = toggleVariant === ActionMenuVariant.KEBAB;
  const toggleLabel = toggleTitle || t('Actions');

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
    if (
      toggleRef.current !== event.target &&
      !toggleRef.current?.contains(event.target) &&
      !menuRef.current?.contains(event.target)
    ) {
      onToggleClick(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleMenuKeys);
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // This needs to be run only on component mount/unmount

  const handleToggleClick = () => {
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
      data-test={isKebabVariant ? 'kebab-button' : 'actions-menu-button'}
      onClick={handleToggleClick}
      onFocus={onToggleHover}
      onMouseOver={onToggleHover}
    >
      {isKebabVariant ? <RhUiEllipsisVerticalIcon /> : toggleLabel}
    </MenuToggle>
  );
};

export default ActionMenuToggle;
