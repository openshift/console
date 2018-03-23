/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';

import { ResourceIcon } from '../../utils';

export const EndpointRow: React.SFC<EndpointRowProps> = ({endpoint}) => {
  const detail = ['scheme', 'honorLabels', 'targetPort'].reduce((element, field) => _.get(endpoint, field)
    ? <span><span className="text-muted">{field}:</span>{_.get(endpoint, field)}</span>
    : element,
  <span className="text-muted">--</span>);

  return <div>
    <div className="row co-ip-header">
      <div className="col-xs-6">Port</div>
      <div className="col-xs-2">Interval</div>
      <div className="col-xs-4"></div>
    </div>
    <div className="rows">
      <div className="co-ip-row">
        <div className="row">
          <div className="col-xs-6">
            <p><ResourceIcon kind="Service" />{endpoint.port || '--'}</p>
          </div>
          <div className="col-xs-2">
            <p>{endpoint.interval || '--'}</p>
          </div>
          <div className="col-xs-4">
            {detail}
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const EndpointList: React.SFC<EndpointListProps> = (props) => <div className="service-ips">
  { props.endpoints.map((e, i) => <EndpointRow endpoint={e} key={i} />) }
</div>;

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
