import * as React from 'react';
import { Menu } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Action } from '@console/dynamic-plugin-sdk';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { checkAccess } from '@console/internal/components/utils';
import { ActionMenuVariant, MenuOption } from '../types';
import ActionMenuContent from './ActionMenuContent';
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
  const isKebabVariant = variant === ActionMenuVariant.KEBAB;
  const [isVisible, setVisible] = useSafetyFirst(isKebabVariant);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const menuRef = React.useRef(null);
  const menuOptions = options || actions;

  const hideMenu = () => {
    setIsOpen(false);
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

  const menu = (
    <Menu ref={menuRef} containsFlyout onSelect={hideMenu}>
      <ActionMenuContent options={menuOptions} onClick={hideMenu} focusItem={options[0]} />
    </Menu>
  );

  return (
    isVisible && (
      <ActionMenuRenderer
        isOpen={isOpen}
        isDisabled={isDisabled}
        menu={menu}
        menuRef={menuRef}
        toggleVariant={variant}
        toggleTitle={label}
        onToggleClick={setIsOpen}
        onToggleHover={handleHover}
      />
    )
  );
};

export default ActionMenu;
