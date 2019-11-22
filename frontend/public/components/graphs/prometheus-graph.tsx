import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';

import { MonitoringRoutes } from '../../reducers/monitoring';

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

const getQueryBrowserURL = (query: string): string => {
  const params = new URLSearchParams();
  params.set('query0', query);
  return `/monitoring/query-browser?${params.toString()}`;
};

export const PrometheusGraphLink = ({
  children,
  query,
}: React.PropsWithChildren<PrometheusGraphLinkProps>) =>
  query ? (
    <Link to={getQueryBrowserURL(query)} style={{ color: 'inherit', textDecoration: 'none' }}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  );

export const PrometheusGraph: React.FC<PrometheusGraphProps> = React.forwardRef(
  ({ children, className, title }, ref: React.RefObject<HTMLDivElement>) => (
    <div ref={ref} className={classNames('graph-wrapper', className)}>
      {title && <h5 className="graph-title">{title}</h5>}
      {children}
    </div>
  ),
);

type PrometheusGraphLinkProps = {
  query: string;
};

type PrometheusGraphProps = {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  title?: string;
};
