import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

import * as restrictedSignImg from '../../imgs/restricted-sign.svg';
import { TimeoutError } from '../../co-fetch';

export const Box = ({children, className}) => <div className={classNames('cos-status-box', className)}>{children}</div>;

/** @type {React.SFC<{className?: string, label: string, message?: string, canRetry?: boolean}>} */
export const LoadError = ({label, className, message, canRetry=true}) => <Box className={className}>
  <div className="text-center cos-error-title">
    Error Loading {label}{_.isString(message) ? `: ${message}` : ''}
  </div>
  {canRetry && <div className="text-center">Please <a onClick={window.location.reload.bind(window.location)}>try again</a>.</div>}
</Box>;

export const Loading = ({className}) => <div className={classNames('co-m-loader co-an-fade-in-out', className)}>
  <div className="co-m-loader-dot__one"></div>
  <div className="co-m-loader-dot__two"></div>
  <div className="co-m-loader-dot__three"></div>
</div>;

export const LoadingInline = () => <Loading className="co-m-loader--inline" />;

/** @type {React.SFC<{className?: string}>} */
export const LoadingBox = ({className}) => <Box className={className}><Loading /></Box>;
LoadingBox.displayName = 'LoadingBox';

export const EmptyBox = ({label}) => <Box>
  <div className="text-center">{label ? `No ${label} Found` : 'Not Found'}</div>
</Box>;
EmptyBox.displayName = 'EmptyBox';

export const MsgBox = ({title, detail, className = ''}) => <Box className={className}>
  {title && <div className="cos-status-box__title">{title}</div>}
  {detail && <div className="text-center cos-status-box__detail">{detail}</div>}
</Box>;
MsgBox.displayName = 'MsgBox';

export const AccessDenied = ({message}) => <Box className="text-center">
  <img className="cos-status-box__access-denied-icon" src={restrictedSignImg} />
  <MsgBox title="Restricted Access" detail="You don't have access to this section due to cluster policy." />
  { _.isString(message) && <div className="alert alert-danger text-left"><span className="pficon pficon-error-circle-o"></span>{ message }</div>}
</Box>;
AccessDenied.displayName = 'AccessDenied';

const Data = props => {
  const {EmptyMsg, label, data} = props;
  let component = props.children;
  if (!data || _.isEmpty(data)) {
    component = EmptyMsg ? <EmptyMsg /> : <EmptyBox label={label} />;
    return <div className="loading-box loading-box__loaded">{component}</div>;
  }

  return <div className="loading-box loading-box__loaded">{props.children}</div>;
};

export const StatusBox = props => {
  const {label, loadError, loaded} = props;

  if (loadError) {
    const status = _.get(loadError, 'response.status');
    if (status === 404) {
      return <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading co-m-pane__heading--center">404: Not Found</h1>
      </div>;
    }
    if (status === 403 || _.includes(_.toLower(loadError), 'access denied')) {
      return <AccessDenied message={loadError.message} />;
    }

    if (loaded && loadError instanceof TimeoutError) {
      return <Data {...props}>
        <div className="co-m-timeout-error text-muted">Timed out fetching new data. The data below is stale.</div>
        {props.children}
      </Data>;
    }

    return <LoadError message={loadError.message} label={label} className="loading-box loading-box__errored" />;
  }

  if (!loaded) {
    return <LoadingBox className="loading-box loading-box__loading" />;
  }
  return <Data {...props} />;
};

StatusBox.displayName = 'StatusBox';
