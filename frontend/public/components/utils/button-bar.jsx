import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from'classnames';
import * as PropTypes from 'prop-types';

import { LoadingInline } from './status-box';

const injectDisabled = (children, disabled) => {
  return React.Children.map(children, c => {
    if (!_.isObject(c) || c.type !== 'button') {
      return c;
    }

    return React.cloneElement(c, { disabled: c.props.disabled || disabled });
  });
};

const ErrorMessage = ({message}) => <div className="co-m-message co-m-message--error">{message}</div>;
const InfoMessage = ({message}) => <div className="co-m-message co-m-message--info">{message}</div>;

// NOTE: DO NOT use <a> elements within a ButtonBar.
// They don't support the disabled attribute, and therefore
// can't be disabled during a pending promise/request.
export const ButtonBar = ({children, className, errorMessage, infoMessage, inProgress}) => {
  return <div className={classNames(className, 'co-m-btn-bar')}>
    {errorMessage && <ErrorMessage message={errorMessage} />}
    {injectDisabled(children, inProgress)}
    {inProgress && <LoadingInline />}
    {infoMessage && <InfoMessage message={infoMessage} />}
  </div>;
};

ButtonBar.propTypes = {
  children: PropTypes.node.isRequired,
  errorMessage: PropTypes.string,
  infoMessage: PropTypes.string,
  inProgress: PropTypes.bool.isRequired,
};
