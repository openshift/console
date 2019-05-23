import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

import { connectToURLs, MonitoringRoutes } from '../../reducers/monitoring';

const getPrometheusExpressionBrowserURL = (urls, query): string => {
  const base = urls && urls[MonitoringRoutes.Prometheus];
  if (!base || _.isEmpty(query)) {
    return null;
  }
  const params = new URLSearchParams();
  params.set('g0.range_input', '1h');
  params.set('g0.expr', query);
  params.set('g0.tab', '0');
  return `${base}/graph?${params.toString()}`;
};

const PrometheusGraphLink = connectToURLs(MonitoringRoutes.Prometheus)(
  ({children, query, urls}: React.PropsWithChildren<PrometheusGraphLinkProps>) => {
    const url = getPrometheusExpressionBrowserURL(urls, query);
    return url
      ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{children}</a>
      : <React.Fragment>{children}</React.Fragment>;
  }
);

export const PrometheusGraph: React.FC<PrometheusGraphProps> = ({children, className, query, title}) => {
  return <div className={classNames('graph-wrapper', className)}>
    { title && <h5 className="graph-title graph-title--left">{title}</h5> }
    <PrometheusGraphLink query={query}>
      {children}
    </PrometheusGraphLink>
  </div>;
};

type PrometheusGraphLinkProps = {
  query: string;
  urls?: string[];
};

type PrometheusGraphProps = {
  className?: string;
  query: string;
  title?: string;
}
