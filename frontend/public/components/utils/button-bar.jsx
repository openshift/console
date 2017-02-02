import React from 'react';
import classNames from 'classnames';

import {LoadingInline} from './';

const injectDisabled = (children, disabled) => {
  return React.Children.map(children, c => {
    if (!_.isObject(c) || c.type !== 'button') {
      return c;
    }

    return React.cloneElement(c, { disabled: c.props.disabled || disabled });
  });
};

// NOTE: DO NOT use <a> elements within a ButtonBar.
// They don't support the disabled attribute, and therefore
// can't be disabled during a pending promise/request.
export const ButtonBar = props => {
  const childProps = _.omit(props, ['children', 'className', 'inProgress', 'message']);
  return <div className={classNames(props.className, 'co-m-btn-bar')} {...childProps}>
    {injectDisabled(props.children, props.inProgress)}
    {props.inProgress && <LoadingInline />}
    {props.message && <div className="co-m-message co-m-message--info">{props.message}</div>}
  </div>;
};

ButtonBar.propTypes = {
  children: React.PropTypes.node.isRequired,
  inProgress: React.PropTypes.bool.isRequired,
  message: React.PropTypes.string,
};
