import * as React from 'react';
import {
  KEY_CODES,
  MenuItem,
  Tooltip,
  DropdownItemProps,
  MenuItemProps,
} from '@patternfly/react-core';
import classnames from 'classnames';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Action, ImpersonateKind } from '@console/dynamic-plugin-sdk';
import { useAccessReview, history } from '@console/internal/components/utils';
import { impersonateStateToProps } from '@console/internal/reducers/ui';

export type ActionMenuItemProps = {
  action: Action;
  component?: React.ComponentType<MenuItemProps | DropdownItemProps>;
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
  component,
}) => {
  const { label, icon, disabled, cta } = action;
  const { href, external } = cta as { href: string; external?: boolean };
  const isDisabled = !isAllowed || disabled;
  const classes = classnames({ 'pf-m-disabled': isDisabled });

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
  const Component = component ?? MenuItem;

  const props = {
    icon,
    autoFocus,
    isDisabled,
    className: classes,
    onClick: handleClick,
    'data-test-action': label,
  };

  const extraProps = {
    onKeyDown: handleKeyDown,
    ...(external ? { to: href, isExternalLink: external } : {}),
  };

  return (
    <Component {...props} {...(component ? {} : extraProps)}>
      {label}
    </Component>
  );
};

const AccessReviewActionItem = connect(impersonateStateToProps)(
  (props: ActionMenuItemProps & { impersonate: ImpersonateKind }) => {
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
