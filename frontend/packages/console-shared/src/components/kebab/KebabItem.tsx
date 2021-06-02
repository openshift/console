import * as React from 'react';
import { KEY_CODES, Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import { Action } from '@console/dynamic-plugin-sdk';
import { useAccessReview } from '@console/internal/components/utils';
import { impersonateStateToProps } from '@console/internal/reducers/ui';

export type KebabItemProps = {
  option: Action;
  onClick: (event: React.MouseEvent<{}>, action: Action) => void;
  autoFocus?: boolean;
  onEscape?: () => void;
};

const KebabItemButton: React.FC<KebabItemProps & { isAllowed: boolean }> = ({
  option,
  onClick,
  onEscape,
  autoFocus,
  isAllowed,
}) => {
  const handleEscape = (e) => {
    if (e.keyCode === KEY_CODES.ESCAPE_KEY) {
      onEscape();
    }
  };
  const disabled = !isAllowed || option.disabled;
  const classes = classNames('pf-c-dropdown__menu-item', { 'pf-m-disabled': disabled });
  return (
    <button
      type="button"
      className={classes}
      onClick={(e) => !disabled && onClick(e, option)}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      onKeyDown={onEscape && handleEscape}
      disabled={disabled}
      data-test-action={option.id}
    >
      {option.icon && <span className="oc-kebab__icon">{option.icon}</span>}
      {option.label}
    </button>
  );
};

// eslint-disable-next-line no-underscore-dangle
const KebabItemAccessReview_ = (props: KebabItemProps & { impersonate: string }) => {
  const { option, impersonate } = props;
  const isAllowed = useAccessReview(option.accessReview, impersonate);
  return <KebabItemButton {...props} isAllowed={isAllowed} />;
};

const KebabItemAccessReview = connect(impersonateStateToProps)(KebabItemAccessReview_);

const KebabItem: React.FC<KebabItemProps> = (props) => {
  const { option } = props;
  let item;

  if (option.accessReview) {
    item = <KebabItemAccessReview {...props} />;
  } else {
    item = <KebabItemButton {...props} isAllowed />;
  }

  return option.tooltip ? (
    <Tooltip position="left" content={option.tooltip}>
      {item}
    </Tooltip>
  ) : (
    item
  );
};

export default KebabItem;
