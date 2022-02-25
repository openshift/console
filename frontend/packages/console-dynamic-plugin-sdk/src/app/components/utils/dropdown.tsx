import * as React from 'react';
import { CaretDownIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { ActionsMenuProps } from '../../../extensions/console-types';
import { impersonateStateToProps } from '../../core/reducers/coreSelectors';
import { useSafetyFirst } from '../safety-first';
import { checkAccess } from './rbac';

type ActionsMenuDropdownProps = ActionsMenuProps & {
  active?: boolean;
  disabled?: boolean;
  items?: unknown; // ??! TO DO
  selectedKey?: string;
};

export const ActionsMenuDropdown: React.SFC<ActionsMenuDropdownProps> = ({
  active: activeProp,
  actions,
  disabled,
  selectedKey,
  title: titleProp = 'Actions',
  items,
}) => {
  const [active, setActive] = React.useState(!!activeProp);
  const [title, setTitle] = React.useState(titleProp);
  const dropdownElement = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    items && setTitle(items[selectedKey]);
  }, [selectedKey, items]);

  function hide(e) {
    e && e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    window.removeEventListener('click', onWindowClick);
    setActive(false);
  }

  function onWindowClick(event) {
    if (!active) {
      return;
    }

    const { current } = dropdownElement;
    if (!current) {
      return;
    }

    if (event.target === current || (current && current.contains(event.target))) {
      return;
    }

    hide(event);
  }

  const onClick = (event, option) => {
    event.preventDefault();
    if (option.callback) {
      option.callback();
    }
    if (option.href) {
      window.location.replace(option.href);
    }
    hide(event);
  };

  const show = () => {
    window.removeEventListener('click', onWindowClick);
    window.addEventListener('click', onWindowClick);
    setActive(true);
  };

  const toggle = (e) => {
    e.preventDefault();

    if (disabled) {
      return;
    }

    if (active) {
      hide(e);
    } else {
      show();
    }
  };

  return (
    <div
      ref={dropdownElement}
      className={classNames({
        'co-actions-menu pf-c-dropdown': true,
        'pf-m-expanded': active,
      })}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-label="actions-menu-button"
        aria-expanded={active}
        className="pf-c-dropdown__toggle"
        onClick={toggle}
        data-test-id="actions-menu-button"
      >
        <span className="pf-c-dropdown__toggle-text">{title}</span>
        <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
      </button>
      {active && <KebabItems options={actions} onClick={onClick} />}
    </div>
  );
};

const ActionsMenu: React.SFC<ActionsMenuProps> = ({ actions, impersonate, title = undefined }) => {
  const [isVisible, setVisible] = useSafetyFirst(false);
  // Check if any actions are visible when actions have access reviews.
  React.useEffect(() => {
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
      .then((results) => setVisible(_.some(results, 'status.allowed')))
      .catch(() => setVisible(true));
  }, [actions, impersonate, setVisible]);
  return isVisible ? <ActionsMenuDropdown actions={actions} title={title} /> : null;
};

export const ConnectedActionsMenu = connect(impersonateStateToProps)(ActionsMenu);
