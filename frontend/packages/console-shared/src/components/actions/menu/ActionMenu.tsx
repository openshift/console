import * as React from 'react';
import { FocusTrap, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { checkAccess } from '@console/internal/components/utils';
import { Popper } from '../../popper';
import ActionMenuContent from './ActionMenuContent';
import { ActionMenuVariant, MenuOption } from './menu-types';

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
  const [active, setActive] = React.useState<boolean>(false);
  const toggleRef = React.useRef<HTMLButtonElement>();
  const toggleRefCb = React.useCallback(() => toggleRef.current, []);
  const menuRef = React.useRef<HTMLDivElement>();
  const menuRefCb = React.useCallback(() => menuRef.current, []);
  const toggleLabel = label || t('console-shared~Actions');

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

  const menuOptions = options || actions;

  return (
    <div>
      <MenuToggle
        variant={variant}
        innerRef={toggleRef}
        isExpanded={active}
        isDisabled={isDisabled}
        aria-expanded={active}
        aria-label={toggleLabel}
        aria-haspopup="true"
        data-test-id="menu-toggle-button"
        onClick={toggleMenu}
        onFocus={handleHover}
        onMouseEnter={handleHover}
      >
        {variant === ActionMenuVariant.KEBAB ? <EllipsisVIcon /> : toggleLabel}
      </MenuToggle>
      <Popper
        open={!isDisabled && active}
        placement="bottom-end"
        onRequestClose={handleRequestClose}
        reference={toggleRefCb}
        closeOnEsc
        closeOnOutsideClick
      >
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
            returnFocusOnDeactivate: false,
            fallbackFocus: menuRefCb,
          }}
        >
          <div ref={menuRef} className="pf-c-menu pf-m-flyout">
            <ActionMenuContent
              options={menuOptions}
              onClick={hideMenu}
              focusItem={menuOptions[0]}
            />
          </div>
        </FocusTrap>
      </Popper>
    </div>
  );
};

export default ActionMenu;
