import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Alert, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import * as restrictedSignImg from '../../imgs/restricted-sign.svg';
import { TimeoutError } from '../../co-fetch';

export const Box: React.FC<BoxProps> = ({ children, className }) => (
  <div className={classNames('cos-status-box', className)}>{children}</div>
);

export const LoadError: React.FC<LoadErrorProps> = ({
  label,
  className,
  message,
  canRetry = true,
}) => (
  <Box className={className}>
    <div className="text-center cos-error-title">
      Error Loading {label}
      {_.isString(message) ? `: ${message}` : ''}
    </div>
    {canRetry && (
      <div className="text-center">
        Please{' '}
        <Button
          type="button"
          onClick={window.location.reload.bind(window.location)}
          variant="link"
          isInline
        >
          try again
        </Button>
        .
      </div>
    )}
  </Box>
);
LoadError.displayName = 'LoadError';

export const Loading: React.FC<LoadingProps> = ({ className }) => (
  <div className={classNames('co-m-loader co-an-fade-in-out', className)}>
    <div className="co-m-loader-dot__one" />
    <div className="co-m-loader-dot__two" />
    <div className="co-m-loader-dot__three" />
  </div>
);
Loading.displayName = 'Loading';

export const LoadingInline: React.FC<{}> = () => <Loading className="co-m-loader--inline" />;
LoadingInline.displayName = 'LoadingInline';

export const LoadingBox: React.FC<LoadingBoxProps> = ({ className, message }) => (
  <Box className={classNames('cos-status-box--loading', className)}>
    <Loading />
    {message && <div className="cos-status-box__loading-message">{message}</div>}
  </Box>
);
LoadingBox.displayName = 'LoadingBox';

export const EmptyBox: React.FC<EmptyBoxProps> = ({ label }) => {
  const { t } = useTranslation();
  return (
    <Box>
      <div data-test="empty-message" className="text-center">
        {label ? t('utils~No {{label}} found', { label }) : t('utils~Not found')}
      </div>
    </Box>
  );
};
EmptyBox.displayName = 'EmptyBox';

export const MsgBox: React.FC<MsgBoxProps> = ({ title, detail, className = '' }) => (
  <Box className={className}>
    {title && <div className="cos-status-box__title">{title}</div>}
    {detail && <div className="text-center cos-status-box__detail">{detail}</div>}
  </Box>
);
MsgBox.displayName = 'MsgBox';

export const AccessDenied: React.FC<AccessDeniedProps> = ({ message }) => (
  <div>
    <Box className="text-center">
      <img className="cos-status-box__access-denied-icon" src={restrictedSignImg} />
      <MsgBox
        title="Restricted Access"
        detail="You don't have access to this section due to cluster policy."
      />
    </Box>
    {_.isString(message) && (
      <Alert isInline className="co-alert" variant="danger" title="Error details">
        {message}
      </Alert>
    )}
  </div>
);
AccessDenied.displayName = 'AccessDenied';

const Data: React.FC<DataProps> = ({
  NoDataEmptyMsg,
  EmptyMsg,
  label,
  data,
  unfilteredData,
  children,
}) => {
  if (NoDataEmptyMsg && _.isEmpty(unfilteredData)) {
    return (
      <div className="loading-box loading-box__loaded">
        {NoDataEmptyMsg ? <NoDataEmptyMsg /> : <EmptyBox label={label} />}
      </div>
    );
  }

  if (!data || _.isEmpty(data)) {
    return (
      <div className="loading-box loading-box__loaded">
        {EmptyMsg ? <EmptyMsg /> : <EmptyBox label={label} />}
      </div>
    );
  }
  return <div className="loading-box loading-box__loaded">{children}</div>;
};
Data.displayName = 'Data';

export const StatusBox: React.FC<StatusBoxProps> = (props) => {
  const { loadError, loaded, skeleton, ...dataProps } = props;

  if (loadError) {
    const status = _.get(loadError, 'response.status');
    if (status === 404) {
      return (
        <div className="co-m-pane__body">
          <h1 className="co-m-pane__heading co-m-pane__heading--center">404: Not Found</h1>
        </div>
      );
    }
    if (status === 403) {
      return <AccessDenied message={loadError.message} />;
    }

    if (loaded && loadError instanceof TimeoutError) {
      return (
        <Data {...dataProps}>
          <div className="co-m-timeout-error text-muted">
            Timed out fetching new data. The data below is stale.
          </div>
          {props.children}
        </Data>
      );
    }

    return (
      <LoadError
        message={loadError.message}
        label={props.label}
        className="loading-box loading-box__errored"
      />
    );
  }

  if (!loaded) {
    return skeleton ? <>{skeleton}</> : <LoadingBox className="loading-box loading-box__loading" />;
  }
  return <Data {...dataProps} />;
};
StatusBox.displayName = 'StatusBox';

type BoxProps = {
  children: React.ReactNode;
  className?: string;
};

type LoadErrorProps = {
  label: string;
  className?: string;
  message?: string;
  canRetry?: boolean;
};

type LoadingProps = {
  className?: string;
};

type LoadingBoxProps = {
  className?: string;
  message?: string;
};

type EmptyBoxProps = {
  label?: string;
};

type MsgBoxProps = {
  title?: string;
  detail?: React.ReactNode;
  className?: string;
};

type AccessDeniedProps = {
  message?: string;
};

type DataProps = {
  NoDataEmptyMsg?: React.ComponentType;
  EmptyMsg?: React.ComponentType;
  label?: string;
  unfilteredData?: any;
  data?: any;
  children?: React.ReactNode;
};

type StatusBoxProps = {
  label?: string;
  loadError?: any;
  loaded?: boolean;
  data?: any;
  unfilteredData?: any;
  skeleton?: React.ReactNode;
  NoDataEmptyMsg?: React.ComponentType;
  EmptyMsg?: React.ComponentType;
  children?: React.ReactNode;
};
