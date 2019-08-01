import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

import { connectToURLs, MonitoringRoutes } from '../../reducers/monitoring';

export const getPrometheusExpressionBrowserURL = (urls, queries): string => {
  const base = urls && urls[MonitoringRoutes.Prometheus];
  if (!base || _.isEmpty(queries)) {
    return null;
  }
  const params = new URLSearchParams();
  _.each(queries, (query, i) => {
    params.set(`g${i}.range_input`, '1h');
    params.set(`g${i}.expr`, query);
    params.set(`g${i}.tab`, '0');
  });
  return `${base}/graph?${params.toString()}`;
};

export const PrometheusGraphLink = connectToURLs(MonitoringRoutes.Prometheus)(
  ({children, query, urls}: React.PropsWithChildren<PrometheusGraphLinkProps>) => {
    const url = getPrometheusExpressionBrowserURL(urls, [query]);
    return query
      ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{children}</a>
      : <React.Fragment>{children}</React.Fragment>;
  }
);

export const PrometheusGraph: React.FC<PrometheusGraphProps> = React.forwardRef(
  ({children, className, title}, ref: React.RefObject<HTMLDivElement>) => (
    <div ref={ref} className={classNames('graph-wrapper', className)}>
      {title && <h5 className="graph-title">{title}</h5>}
      {children}
    </div>
  )
);

type PrometheusGraphLinkProps = {
  query: string;
  urls?: string[];
};

type PrometheusGraphProps = {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  title?: string;
}
