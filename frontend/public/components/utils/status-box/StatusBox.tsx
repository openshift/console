import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import {
  IncompleteDataError,
  TimeoutError,
} from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';
import { AccessDenied } from './AccessDenied';
import { LoadError } from './LoadError';
import { LoadingBox } from './LoadingBox';
import { EmptyBox } from './EmptyBox';

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
  const { loadError, loaded, skeleton, data, ...dataProps } = props;
  const { t } = useTranslation();

  if (loadError) {
    const status = _.get(loadError, 'response.status');
    if (status === 404) {
      return (
        <div className="co-m-pane__body">
          <h1 className="co-m-pane__heading co-m-pane__heading--center">
            {t('public~404: Not Found')}
          </h1>
        </div>
      );
    }
    if (status === 403) {
      return <AccessDenied>{loadError.message}</AccessDenied>;
    }

    if (loadError instanceof IncompleteDataError && !_.isEmpty(data)) {
      return (
        <Data data={data} {...dataProps}>
          <Alert
            variant="info"
            isInline
            title={t(
              'public~{{labels}} content is not available in the catalog at this time due to loading failures.',
              {
                labels: new Intl.ListFormat(getLastLanguage() || 'en', {
                  style: 'long',
                  type: 'conjunction',
                }).format(loadError.labels),
              },
            )}
          />
          {props.children}
        </Data>
      );
    }

    if (loaded && loadError instanceof TimeoutError) {
      return (
        <Data data={data} {...dataProps}>
          <div className="co-m-timeout-error text-muted">
            {t('public~Timed out fetching new data. The data below is stale.')}
          </div>
          {props.children}
        </Data>
      );
    }

    return <LoadError label={props.label}>{loadError.message}</LoadError>;
  }

  if (!loaded) {
    return skeleton ? <>{skeleton}</> : <LoadingBox />;
  }
  return <Data data={data} {...dataProps} />;
};
StatusBox.displayName = 'StatusBox';

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
