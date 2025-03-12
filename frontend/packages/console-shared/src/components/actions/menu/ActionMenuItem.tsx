import * as React from 'react';
import { DropdownItemProps, KeyTypes, MenuItem, Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Action, ImpersonateKind, impersonateStateToProps } from '@console/dynamic-plugin-sdk';
import { useAccessReview, history } from '@console/internal/components/utils';

export type ActionMenuItemProps = {
  action: Action;
  component?: React.ComponentType<DropdownItemProps>;
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
      event.stopPropagation();
    },
    [cta, onClick],
  );

  const handleKeyDown = (event) => {
    if (event.keyCode === KeyTypes.Escape) {
      onEscape && onEscape();
    }

    if (event.keyCode === KeyTypes.Enter) {
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
    translate: 'no' as 'no',
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
  ) : action.disabled && action.disabledTooltip ? (
    <Tooltip position="left" content={action.disabledTooltip}>
      <div>{item}</div>
    </Tooltip>
  ) : (
    item
  );
};

export default ActionMenuItem;
