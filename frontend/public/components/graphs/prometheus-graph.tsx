/* eslint-disable no-undef, no-unused-vars */
import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

import { connectToURLs, MonitoringRoutes } from '../../reducers/monitoring';

const getPrometheusUrl = (urls: string[], query: PrometheusQuery[] | string): string => {
  const base = urls && urls[MonitoringRoutes.Prometheus];
  if (!base || !query) {
    return null;
  }

  const queries = _.isArray(query) ? query : [{query}];
  const params = new URLSearchParams();
  _.each(queries, (q, i) => {
    params.set(`g${i}.range_input`, '1h');
    params.set(`g${i}.expr`, q.query);
    params.set(`g${i}.tab`, '0');
  });

  return `${base}/graph?${params.toString()}`;
};

const PrometheusGraphLink = connectToURLs(MonitoringRoutes.Prometheus)(
  ({children, query, urls}: React.PropsWithChildren<PrometheusGraphLinkProps>) => {
    const url = getPrometheusUrl(urls, query);
    return <React.Fragment>
      {
        url
          ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            {children}
          </a>
          : {children}
      }
    </React.Fragment>;
  }
);

export const PrometheusGraph: React.FunctionComponent<PrometheusGraphProps> = ({children, title, className, query}) => {
  return <div className={classNames('graph-wrapper', className)}>
    { title && <h5 className="graph-title graph-title--left">{title}</h5> }
    <PrometheusGraphLink query={query}>
      {children}
    </PrometheusGraphLink>
  </div>;
};

type PrometheusQuery = {
  name: string;
  query: string;
};

type PrometheusGraphLinkProps = {
  query: PrometheusQuery[] | string;
  urls?: string[];
};

type PrometheusGraphProps = {
  className?: string;
  query: PrometheusQuery[] | string;
  title?: string;
}
