import * as _ from 'lodash-es';
import * as React from 'react';
import classnames from 'classnames';
import * as PropTypes from 'prop-types';
import { Alert, AlertGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { LoadingInline } from './status-box';

const injectDisabled = (children, disabled) => {
  return React.Children.map(children, (c) => {
    if (!_.isObject(c) || c.type !== 'button') {
      return c;
    }

    return React.cloneElement(c, { disabled: c.props.disabled || disabled });
  });
};

const ErrorMessage = ({ message }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      className="co-alert co-alert--scrollable"
      variant="danger"
      title={t('public~An error occurred')}
    >
      <div className="co-pre-line">{message}</div>
    </Alert>
  );
};
const InfoMessage = ({ message }) => (
  <Alert isInline className="co-alert" variant="info" title={message} />
);
const SuccessMessage = ({ message }) => (
  <Alert isInline className="co-alert" variant="success" title={message} />
);

// NOTE: DO NOT use <a> elements within a ButtonBar.
// They don't support the disabled attribute, and therefore
// can't be disabled during a pending promise/request.
/** @type {React.SFC<{children: any, className?: string, errorMessage?: React.ReactNode, infoMessage?: string, successMessage?: string, inProgress?: boolean}}>} */
export const ButtonBar = ({
  children,
  className,
  errorMessage,
  infoMessage,
  successMessage,
  inProgress,
}) => {
  return (
    <div className={classnames(className, 'co-m-btn-bar')}>
      <AlertGroup
        isLiveRegion
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
      >
        {successMessage && <SuccessMessage message={successMessage} />}
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {injectDisabled(children, inProgress)}
        {inProgress && <LoadingInline />}
        {infoMessage && <InfoMessage message={infoMessage} />}
      </AlertGroup>
    </div>
  );
};

ButtonBar.propTypes = {
  children: PropTypes.node.isRequired,
  successMessage: PropTypes.string,
  errorMessage: PropTypes.node,
  infoMessage: PropTypes.string,
  inProgress: PropTypes.bool,
  className: PropTypes.string,
};
