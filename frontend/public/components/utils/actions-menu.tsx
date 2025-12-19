import {
  ImpersonateKind,
  impersonateStateToProps,
  useSafetyFirst,
} from '@console/dynamic-plugin-sdk';
import { Button, Dropdown, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { some } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';

import { ReactNode, RefObject, useEffect, useState } from 'react';
import { KebabItem, KebabItems, KebabOption } from './kebab';
import { checkAccess } from './rbac';

type ActionsMenuProps = {
  actions: KebabOption[];
  title?: ReactNode;
};

type ActionsMenuDropdownProps = {
  actions: KebabOption[];
  title?: ReactNode;
  active?: boolean;
};

const ActionsMenuDropdown: React.FCC<ActionsMenuDropdownProps> = ({ actions, title, active }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(!!active);

  const onClick = (event, option) => {
    event.preventDefault();

    if (option.callback) {
      option.callback();
    }

    if (option.href) {
      navigate(option.href);
    }

    setIsActive(false);
  };

  if (actions.length === 0) {
    return null;
  }

  if (actions.length === 1) {
    return <KebabItem option={actions[0]} onClick={onClick} Component={Button} />;
  }

  return (
    <Dropdown
      isOpen={isActive}
      onSelect={() => setIsActive(false)}
      onOpenChange={setIsActive}
      shouldFocusToggleOnSelect
      popperProps={{
        enableFlip: true,
        position: 'right',
      }}
      toggle={(toggleRef: RefObject<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsActive(!active)}
          isExpanded={active}
          data-test-id="actions-menu-button"
        >
          {title || t('public~Actions')}
        </MenuToggle>
      )}
    >
      <KebabItems options={actions} onClick={onClick} />
    </Dropdown>
  );
};

export const ActionsMenu: React.FCC<ActionsMenuProps> = connect(impersonateStateToProps)(
  ({
    actions,
    impersonate,
    title = undefined,
  }: ActionsMenuProps & { impersonate?: ImpersonateKind }) => {
    const [isVisible, setVisible] = useSafetyFirst(false);

    // Check if any actions are visible when actions have access reviews.
    useEffect(() => {
      if (!actions.length) {
        setVisible(false);
        return;
      }
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
        .then((results) => setVisible(some(results, 'status.allowed')))
        .catch(() => setVisible(true));
    }, [actions, impersonate, setVisible]);
    return isVisible ? <ActionsMenuDropdown actions={actions} title={title} /> : null;
  },
);
