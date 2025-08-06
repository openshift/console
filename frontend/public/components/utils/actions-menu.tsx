import {
  ImpersonateKind,
  impersonateStateToProps,
  useSafetyFirst,
} from '@console/dynamic-plugin-sdk';
import { Dropdown, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { some } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { ReactNode, RefObject, useEffect, useState } from 'react';
import { KebabItems, KebabOption } from './kebab';
import { checkAccess } from './rbac';

type ActionsMenuProps = {
  actions: KebabOption[];
  title?: ReactNode;
};

const ActionsMenuDropdown = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [active, setActive] = useState(!!props.active);

  const onClick = (event, option) => {
    event.preventDefault();

    if (option.callback) {
      option.callback();
    }

    if (option.href) {
      navigate(option.href);
    }

    setActive(false);
  };

  return (
    <Dropdown
      isOpen={active}
      onSelect={() => setActive(false)}
      onOpenChange={setActive}
      shouldFocusToggleOnSelect
      popperProps={{
        enableFlip: true,
        position: 'right',
      }}
      toggle={(toggleRef: RefObject<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setActive(!active)}
          isExpanded={active}
          data-test-id="actions-menu-button"
        >
          {props.title || t('public~Actions')}
        </MenuToggle>
      )}
    >
      <KebabItems options={props.actions} onClick={onClick} />
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
