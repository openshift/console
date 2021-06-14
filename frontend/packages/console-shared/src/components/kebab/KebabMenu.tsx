import * as React from 'react';
import { FocusTrap } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { checkAccess, history } from '@console/internal/components/utils';
import { Popper } from '../popper';
import { kebabActionsToMenu } from './kebab-utils';
import KebabMenuItems from './KebabMenuItems';

type KebabMenuProps = {
  actions: Action[];
  isDisabled?: boolean;
};

const KebabMenu: React.FC<KebabMenuProps> = ({ actions, isDisabled }) => {
  const [active, setActive] = React.useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLButtonElement>();
  const { t } = useTranslation();

  const hide = () => {
    dropdownRef.current?.focus();
    setActive(false);
  };

  const toggle = () => {
    setActive((value) => !value);
  };

  const handleClick = (event, action: Action) => {
    event.preventDefault();

    if (_.isFunction(action.cta)) {
      action.cta();
      hide();
    } else if (_.isObject(action.cta)) {
      const { href, external } = action.cta;
      if (external) {
        window.open(href);
      } else {
        history.push(href);
      }
    }
  };

  const handleHover = () => {
    // Check access when hovering over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(actions, (action: Action) => {
      if (action.accessReview) {
        checkAccess(action.accessReview);
      }
    });
  };

  const handleRequestClose = (e?: MouseEvent) => {
    if (!e || !dropdownRef.current?.contains(e.target as Node)) {
      hide();
    }
  };

  const getPopperReference = () => dropdownRef.current;

  const menuOptions = kebabActionsToMenu(actions);

  return (
    <div
      className={classNames({
        'dropdown pf-c-dropdown': true,
        'pf-m-expanded': active,
      })}
    >
      <button
        ref={dropdownRef}
        type="button"
        aria-expanded={active}
        aria-haspopup="true"
        aria-label={t('console-shared~Actions')}
        className="pf-c-dropdown__toggle pf-m-plain"
        data-test-id="kebab-button"
        disabled={isDisabled}
        onClick={toggle}
        onFocus={handleHover}
        onMouseEnter={handleHover}
      >
        <EllipsisVIcon />
      </button>
      <Popper
        open={!isDisabled && active}
        placement="bottom-end"
        onRequestClose={handleRequestClose}
        reference={getPopperReference}
        closeOnEsc
        closeOnOutsideClick
      >
        <FocusTrap
          focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: false }}
        >
          <div className="pf-c-dropdown pf-m-expanded">
            <KebabMenuItems
              options={menuOptions}
              onClick={handleClick}
              className="oc-kebab__popper-items"
              focusItem={menuOptions[0]}
            />
          </div>
        </FocusTrap>
      </Popper>
    </div>
  );
};

export default KebabMenu;
