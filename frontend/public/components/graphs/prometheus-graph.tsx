import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import * as UIActions from '../../actions/ui';
import { FLAGS } from '../../const';
import { featureReducerName } from '../../reducers/features';
import { MonitoringRoutes } from '../../reducers/monitoring';
import { getActivePerspective, getActiveNamespace } from '../../reducers/ui';
import { RootState } from '../../redux';

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

const mapStateToProps = (state: RootState) => ({
  activePerspective: getActivePerspective(state),
  canAccessMonitoring:
    !!state[featureReducerName].get(FLAGS.CAN_GET_NS) && !!window.SERVER_FLAGS.prometheusBaseURL,
  namespace: getActiveNamespace(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setActivePerspective: (id: string) => dispatch(UIActions.setActivePerspective(id)),
});

export const PrometheusGraphLink_: React.FC<PrometheusGraphLinkProps> = ({
  activePerspective,
  canAccessMonitoring,
  children,
  namespace,
  query,
  setActivePerspective,
}) => {
  const onClick = React.useCallback(() => {
    if (!canAccessMonitoring && activePerspective !== 'dev') {
      setActivePerspective('dev');
    }
  }, [canAccessMonitoring, setActivePerspective, activePerspective]);

  if (!query) {
    return <>{children}</>;
  }

  const params = new URLSearchParams();
  params.set('query0', query);

  const url =
    canAccessMonitoring && activePerspective === 'admin'
      ? `/monitoring/query-browser?${params.toString()}`
      : `/metrics/ns/${namespace}?${params.toString()}`;

  return (
    <Link to={url} onClick={onClick} style={{ color: 'inherit', textDecoration: 'none' }}>
      {children}
    </Link>
  );
};
export const PrometheusGraphLink = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PrometheusGraphLink_);

export const PrometheusGraph: React.FC<PrometheusGraphProps> = React.forwardRef(
  ({ children, className, title }, ref: React.RefObject<HTMLDivElement>) => (
    <div ref={ref} className={classNames('graph-wrapper', className)}>
      {title && <h5 className="graph-title">{title}</h5>}
      {children}
    </div>
  ),
);

type PrometheusGraphLinkProps = {
  activePerspective: string;
  canAccessMonitoring: boolean;
  namespace?: string;
  query: string;
  setActivePerspective: (id: string) => undefined;
};

type PrometheusGraphProps = {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  title?: string;
};
