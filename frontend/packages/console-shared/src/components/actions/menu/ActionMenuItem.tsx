import * as React from 'react';
import { KEY_CODES, MenuItem, Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Action } from '@console/dynamic-plugin-sdk';
import { useAccessReview, history } from '@console/internal/components/utils';
import { impersonateStateToProps } from '@console/internal/reducers/ui';

export type ActionMenuItemProps = {
  action: Action;
  autoFocus?: boolean;
  onClick?: () => void;
  onEscape?: () => void;
};

const ActionItem: React.FC<ActionMenuItemProps & { isAllowed: boolean }> = ({
  action,
  onClick,
  onEscape,
  autoFocus,
  isAllowed,
}) => {
  const { label, icon, disabled, cta } = action;
  const { href, external } = cta as { href: string; external?: boolean };
  const isDisabled = !isAllowed || disabled;
  const classes = classNames({ 'pf-m-disabled': isDisabled });

  const handleClick = React.useCallback(
    (event) => {
      event.preventDefault();
      if (_.isFunction(cta)) {
        cta();
      } else if (_.isObject(cta)) {
        if (!cta.external) {
          history.push(cta.href);
        }
      }
      onClick && onClick();
    },
    [cta, onClick],
  );

  const handleKeyDown = (event) => {
    if (event.keyCode === KEY_CODES.ESCAPE_KEY) {
      onEscape && onEscape();
    }

    if (event.keyCode === KEY_CODES.ENTER) {
      handleClick(event);
    }
  };

  return (
    <MenuItem
      className={classes}
      icon={icon}
      autoFocus={autoFocus}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      isDisabled={isDisabled}
      data-test-action={label}
      tabIndex={0} // Override PF tabIndex -1 to make action items tabbable
      translate="no" // Need to pass translate="no" as a workaround to a bug in @types/react.
      {...(external ? { to: href, isExternalLink: external } : {})}
    >
      {label}
    </MenuItem>
  );
};

const AccessReviewActionItem = connect(impersonateStateToProps)(
  (props: ActionMenuItemProps & { impersonate: string }) => {
    const { action, impersonate } = props;
    const isAllowed = useAccessReview(action.accessReview, impersonate);
    return <ActionItem {...props} isAllowed={isAllowed} />;
  },
);

const ActionMenuItem: React.FC<ActionMenuItemProps> = (props) => {
  const { action } = props;
  let item;

  if (action.accessReview) {
    item = <AccessReviewActionItem {...props} />;
  } else {
    item = <ActionItem {...props} isAllowed />;
  }

  return action.tooltip ? (
    <Tooltip position="left" content={action.tooltip}>
      {item}
    </Tooltip>
  ) : (
    item
  );
};

export default ActionMenuItem;
