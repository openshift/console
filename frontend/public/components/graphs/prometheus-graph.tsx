import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { FLAGS } from '@console/shared';
import { featureReducerName } from '../../reducers/features';
import { getActivePerspective, getActiveNamespace } from '../../reducers/ui';
import { RootState } from '../../redux';

export const getPrometheusExpressionBrowserURL = (url, queries): string => {
  if (!url || _.isEmpty(queries)) {
    return null;
  }
  const params = new URLSearchParams();
  _.each(queries, (query, i) => {
    params.set(`g${i}.range_input`, '1h');
    params.set(`g${i}.expr`, query);
    params.set(`g${i}.tab`, '0');
  });
  return `${url}/graph?${params.toString()}`;
};

const mapStateToProps = (state: RootState) => ({
  canAccessMonitoring:
    !!state[featureReducerName].get(FLAGS.CAN_GET_NS) && !!window.SERVER_FLAGS.prometheusBaseURL,
  perspective: getActivePerspective(state),
  namespace: getActiveNamespace(state),
});

export const PrometheusGraphLink_: React.FC<PrometheusGraphLinkProps> = ({
  canAccessMonitoring,
  children,
  perspective,
  query,
  namespace,
  ariaChartLabel,
}) => {
  if (!query) {
    return <>{children}</>;
  }

  const params = new URLSearchParams();
  params.set('query0', query);

  const url =
    canAccessMonitoring && perspective === 'admin'
      ? `/monitoring/query-browser?${params.toString()}`
      : `/dev-monitoring/ns/${namespace}/metrics?${params.toString()}`;

  return (
    <Link to={url} aria-label={ariaChartLabel} style={{ color: 'inherit', textDecoration: 'none' }}>
      {children}
    </Link>
  );
};
export const PrometheusGraphLink = connect(mapStateToProps)(PrometheusGraphLink_);

export const PrometheusGraph: React.FC<PrometheusGraphProps> = React.forwardRef(
  ({ children, className, title }, ref: React.RefObject<HTMLDivElement>) => (
    <div ref={ref} className={classNames('graph-wrapper graph-wrapper__horizontal-bar', className)}>
      {title && <h5 className="graph-title">{title}</h5>}
      {children}
    </div>
  ),
);

type PrometheusGraphLinkProps = {
  canAccessMonitoring: boolean;
  perspective: string;
  query: string;
  namespace?: string;
  ariaChartLabel?: string;
};

type PrometheusGraphProps = {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  title?: string;
};
