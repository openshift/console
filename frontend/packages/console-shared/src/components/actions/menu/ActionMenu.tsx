import type { ComponentProps, FC } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Menu, MenuContent, MenuList, Popper } from '@patternfly/react-core';
import * as _ from 'lodash';
import type { Action, MenuOption } from '@console/dynamic-plugin-sdk';
import { checkAccess } from '@console/internal/components/utils/rbac';
import { ActionMenuVariant } from '../types';
import ActionMenuContent from './ActionMenuContent';
import ActionMenuToggle from './ActionMenuToggle';

type ActionMenuProps = {
  actions: Action[];
  options?: MenuOption[];
  isDisabled?: boolean;
  variant?: ActionMenuVariant;
  label?: string;
  className?: string;
  appendTo?: ComponentProps<typeof Popper>['appendTo'];
};

export const ActionMenu: FC<ActionMenuProps> = ({
  actions,
  options,
  isDisabled,
  variant = ActionMenuVariant.KEBAB,
  label,
  className,
  appendTo,
}) => {
  const isKebabVariant = variant === ActionMenuVariant.KEBAB;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuOptions = options?.length > 0 ? options : actions;

  const allRequireAccessReview =
    actions.length > 0 && actions.every((action) => action.accessReview);

  const [accessReviewAllowed, setAccessReviewAllowed] = useState<boolean>();

  const hideMenu = () => {
    setIsOpen(false);
  };

  const handleHover = useCallback(() => {
    // Check access when hovering over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(actions, (action: Action) => {
      if (action.accessReview) {
        checkAccess(action.accessReview).catch((e) =>
          console.warn('Could not check access for action menu', e),
        );
      }
    });
  }, [actions]);

  // Check if any actions are visible when all actions have access reviews.
  // Kebab menus are always visible (access review happens on hover), and menus
  // with actions that lack an access review are visible without a check.
  useEffect(() => {
    if (isKebabVariant || !allRequireAccessReview) {
      return;
    }

    const promises = actions.map((action) => checkAccess(action.accessReview));
    Promise.all(promises)
      .then((results) => setAccessReviewAllowed(_.some(results, 'status.allowed')))
      .catch(() => setAccessReviewAllowed(true));
  }, [actions, isKebabVariant, allRequireAccessReview]);

  const isVisible =
    actions.length > 0 &&
    (isKebabVariant || !allRequireAccessReview || accessReviewAllowed === true);

  const menu = (
    <Menu ref={menuRef} containsFlyout onSelect={hideMenu}>
      <MenuContent data-test-id="action-items" data-test="action-items">
        <MenuList className={className}>
          <ActionMenuContent options={menuOptions} onClick={hideMenu} focusItem={menuOptions[0]} />
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    isVisible && (
      <div ref={containerRef}>
        <ActionMenuToggle
          isOpen={isOpen}
          isDisabled={isDisabled}
          toggleRef={toggleRef}
          toggleVariant={variant}
          toggleTitle={label}
          menuRef={menuRef}
          onToggleClick={setIsOpen}
          onToggleHover={handleHover}
        />
        <Popper
          triggerRef={toggleRef}
          popper={menu}
          placement="bottom-end"
          isVisible={isOpen}
          appendTo={appendTo || (() => containerRef.current)}
        />
      </div>
    )
  );
};
