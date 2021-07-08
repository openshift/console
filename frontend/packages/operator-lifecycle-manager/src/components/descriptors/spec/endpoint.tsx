import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';

export const EndpointRow: React.FC<EndpointRowProps> = ({ endpoint }) => {
  const detail = ['scheme', 'honorLabels', 'targetPort'].reduce(
    (element, field) =>
      endpoint?.[field] ? (
        <span>
          <span className="text-muted">{field}:</span>
          {endpoint[field]}
        </span>
      ) : (
        element
      ),
    <span className="text-muted">--</span>,
  );

  return (
    <div className="co-ip-row">
      <div className="row">
        <div className="col-xs-6">
          <p>
            <ResourceIcon kind="Service" />
            {endpoint.port || '--'}
          </p>
        </div>
        <div className="col-xs-2">
          <p>{endpoint.interval || '--'}</p>
        </div>
        <div className="col-xs-4">{detail}</div>
      </div>
    </div>
  );
};

export const EndpointList: React.FC<EndpointListProps> = (props) => {
  const { t } = useTranslation();
  return (
    <div className="service-ips">
      <div className="row co-ip-header">
        <div className="col-xs-6">{t('olm~Port')}</div>
        <div className="col-xs-2">{t('olm~Interval')}</div>
        <div className="col-xs-4" />
      </div>
      <div className="rows">
        {props.endpoints ? (
          props.endpoints.map((e) => <EndpointRow endpoint={e} key={e.port} />)
        ) : (
          <span className="text-muted">{t('olm~No endpoints')}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Taken from https://github.com/coreos/prometheus-operator/blob/master/Documentation/api.md#endpoint
 */
export type Endpoint = {
  port?: string;
  targetPort?: number | string;
  scheme?: string;
  honorLabels?: boolean;
  interval?: string;
};

export type EndpointRowProps = {
  endpoint: Endpoint;
};

export type EndpointListProps = {
  endpoints: Endpoint[];
};
