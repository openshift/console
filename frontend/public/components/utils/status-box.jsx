import * as React from 'react';
import * as classNames from'classnames';

import { inject } from './index';
import * as restrictedSignImg from '../../imgs/restricted-sign.svg';

export const Box = ({children, className}) => <div className={classNames('cos-status-box', className)}>{children}</div>;

export const LoadError = ({label}) => <Box>
  <div className="cos-text-center cos-error-title">Error Loading {label}</div>
  <div className="cos-text-center">Please <a onClick={window.location.reload.bind(window.location)}>try again</a>.</div>
</Box>;

export const Loading = ({className}) => <div className={classNames('co-m-loader co-an-fade-in-out', className)}>
  <div className="co-m-loader-dot__one"></div>
  <div className="co-m-loader-dot__two"></div>
  <div className="co-m-loader-dot__three"></div>
</div>;

export const LoadingInline = () => <Loading className="co-m-loader--inline" />;

export const LoadingBox = () => <Box><Loading /></Box>;

export const EmptyBox = ({label}) => <Box>
  <div className="cos-text-center">No {label} Found</div>
</Box>;

export const MsgBox = ({title, detail, className}) => <Box className={className}>
  {title && <div className="cos-status-box__title">{title}</div>}
  {detail && <div className="cos-text-center cos-status-box__detail">{detail}</div>}
</Box>;

export const AccessDenied = () => <Box className="cos-text-center">
  <img className="cos-status-box__access-denied-icon" src={restrictedSignImg} />
  <MsgBox title="Restricted Access" detail="You don't have access to this section due to cluster policy" />
</Box>;

export const StatusBox = props => {
  const {EmptyMsg, label, loadError, loaded} = props;

  if (loadError) {
    return _.get(loadError, 'response.status') === 403 ? <AccessDenied /> : <LoadError label={label} />;
  }

  if (!loaded) {
    return <LoadingBox />;
  }

  const {data, filters, selected} = props;

  if (!data || _.isEmpty(data)) {
    return EmptyMsg ? <EmptyMsg /> : <EmptyBox label={label} />;
  }

  let children;

  if (_.isArray(data)) {
    children = inject(props.children, {data, filters, selected});
  } else {
    children = inject(props.children, data);
  }

  if (children.length > 1) {
    return <div>{children}</div>;
  }
  return children[0];
};

StatusBox.displayName = 'StatusBox';
