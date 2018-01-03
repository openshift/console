import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from'classnames';

import * as restrictedSignImg from '../../imgs/restricted-sign.svg';
import { TimeoutError } from '../../co-fetch';

export const Box = ({children, className}) => <div className={classNames('cos-status-box', className)}>{children}</div>;

export const LoadError = ({label, className, message}) => <Box className={className}>
  <div className="cos-text-center cos-error-title">
    Error Loading {label}{message ? `: ${message}` : ''}
  </div>
  <div className="cos-text-center">Please <a onClick={window.location.reload.bind(window.location)}>try again</a>.</div>
</Box>;

export const Loading = ({className}) => <div className={classNames('co-m-loader co-an-fade-in-out', className)}>
  <div className="co-m-loader-dot__one"></div>
  <div className="co-m-loader-dot__two"></div>
  <div className="co-m-loader-dot__three"></div>
</div>;

export const LoadingInline = () => <Loading className="co-m-loader--inline" />;

/** @type {React.StatelessComponent<{className?: string}>} */
export const LoadingBox = ({className}) => <Box className={className}><Loading /></Box>;
LoadingBox.displayName = 'LoadingBox';

export const EmptyBox = ({label}) => <Box>
  <div className="cos-text-center">No {label} Found</div>
</Box>;
EmptyBox.displayName = 'EmptyBox';

export const MsgBox = ({title, detail, className = ''}) => <Box className={className}>
  {title && <div className="cos-status-box__title">{title}</div>}
  {detail && <div className="cos-text-center cos-status-box__detail">{detail}</div>}
</Box>;
MsgBox.displayName = 'MsgBox';

export const AccessDenied = () => <Box className="cos-text-center">
  <img className="cos-status-box__access-denied-icon" src={restrictedSignImg} />
  <MsgBox title="Restricted Access" detail="You don't have access to this section due to cluster policy" />
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
      return <div className="co-m-pane__heading">
        <h1 className="co-m-pane__title text-center">404: Not Found</h1>
        <div className="row">
          <div className="col-sm-12 co-error-bg-img"></div>
        </div>
      </div>;
    }
    if (status === 403 || _.includes(_.toLower(loadError), 'access denied')) {
      return <AccessDenied />;
    }

    if (loaded && loadError instanceof TimeoutError) {
      return <Data {...props}>
        <div className="row">
          <div className="col-xs-12 text-center text-muted" style={{paddingBottom: 15}}>Timed out fetching new data. The data below is stale.</div>
        </div>
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
