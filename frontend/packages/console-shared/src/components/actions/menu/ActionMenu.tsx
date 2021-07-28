import * as React from 'react';
import { MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { checkAccess } from '@console/internal/components/utils';
import { ActionMenuVariant, MenuOption } from '../types';
import ActionMenuRenderer from './ActionMenuRenderer';

type ActionMenuProps = {
  actions: Action[];
  options?: MenuOption[];
  isDisabled?: boolean;
  variant?: ActionMenuVariant;
  label?: string;
};

const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  options,
  isDisabled,
  variant = ActionMenuVariant.KEBAB,
  label,
}) => {
  const { t } = useTranslation();
  const isKebabVariant = variant === ActionMenuVariant.KEBAB;
  const [isVisible, setVisible] = useSafetyFirst(isKebabVariant);
  const [active, setActive] = React.useState<boolean>(false);
  const toggleRef = React.useRef<HTMLButtonElement>();
  const toggleRefCb = React.useCallback(() => toggleRef.current, []);
  const toggleLabel = label || t('console-shared~Actions');
  const menuOptions = options || actions;

  const toggleMenu = () => setActive((value) => !value);

  const hideMenu = () => {
    toggleRef.current?.focus();
    setActive(false);
  };

  const handleRequestClose = (e?: MouseEvent) => {
    if (!e || !toggleRef.current?.contains(e.target as Node)) {
      hideMenu();
    }
  };

  const handleHover = React.useCallback(() => {
    // Check access when hovering over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(actions, (action: Action) => {
      if (action.accessReview) {
        checkAccess(action.accessReview);
      }
    });
  }, [actions]);

  // Check if any actions are visible when actions have access reviews.
  React.useEffect(() => {
    if (!actions.length) {
      setVisible(false);
      return;
    }
    // Do nothing if variant is kebab. The action menu should be visible and acces review happens on hover.
    if (isKebabVariant) return;

    const promises = actions.reduce((acc, action) => {
      if (action.accessReview) {
        acc.push(checkAccess(action.accessReview));
      }
      return acc;
    }, []);

    // Only need to resolve if all actions require access review
    if (promises.length !== actions.length) {
      setVisible(true);
      return;
    }
    Promise.all(promises)
      .then((results) => setVisible(_.some(results, 'status.allowed')))
      .catch(() => setVisible(true));
  }, [actions, isKebabVariant, setVisible]);

  return (
    isVisible && (
      <div>
        <MenuToggle
          variant={variant}
          innerRef={toggleRef}
          isExpanded={active}
          isDisabled={isDisabled}
          aria-expanded={active}
          aria-label={toggleLabel}
          aria-haspopup="true"
          data-test-id={isKebabVariant ? 'kebab-button' : 'actions-menu-button'}
          onClick={toggleMenu}
          {...(isKebabVariant ? { onFocus: handleHover, onMouseEnter: handleHover } : {})}
        >
          {isKebabVariant ? <EllipsisVIcon /> : toggleLabel}
        </MenuToggle>
        <ActionMenuRenderer
          open={!isDisabled && active}
          options={menuOptions}
          toggleRef={toggleRefCb}
          onClick={hideMenu}
          onRequestClose={handleRequestClose}
        />
      </div>
    )
  );
};

export default ActionMenu;
