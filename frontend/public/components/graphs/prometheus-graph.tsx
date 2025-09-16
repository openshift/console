import { css } from '@patternfly/react-styles';
import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Title } from '@patternfly/react-core';

import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { FLAGS } from '@console/shared';
import { featureReducerName } from '../../reducers/features';
import { getActiveNamespace } from '../../reducers/ui';
import { RootState } from '../../redux';

const mapStateToProps = (state: RootState) => ({
  canAccessMonitoring:
    !!state[featureReducerName].get(FLAGS.CAN_GET_NS) && !!window.SERVER_FLAGS.prometheusBaseURL,
  namespace: getActiveNamespace(state),
});

const PrometheusGraphLink_: React.FC<PrometheusGraphLinkProps> = ({
  canAccessMonitoring,
  children,
  query,
  namespace,
  ariaChartLinkLabel,
}) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const queries = _.compact(_.castArray(query));
  if (!queries.length) {
    return <>{children}</>;
  }

  const params = new URLSearchParams();
  queries.forEach((q, index) => params.set(`query${index}`, q));

  const url =
    canAccessMonitoring && activePerspective === 'admin'
      ? `/monitoring/query-browser?${params.toString()}`
      : `/dev-monitoring/ns/${namespace}/metrics?${params.toString()}`;

  return (
    <Link
      to={url}
      aria-label={ariaChartLinkLabel}
      style={{ color: 'inherit', textDecoration: 'none' }}
      onClick={() => {
        if (url.startsWith('/dev-monitoring/') && activePerspective !== 'dev') {
          setActivePerspective('dev');
        }
      }}
    >
      {children}
    </Link>
  );
};
export const PrometheusGraphLink = connect(mapStateToProps)(PrometheusGraphLink_);

export const PrometheusGraph: React.FC<PrometheusGraphProps> = React.forwardRef(
  ({ children, className, title }, ref: React.RefObject<HTMLDivElement>) => (
    <div ref={ref} className={css('graph-wrapper graph-wrapper__horizontal-bar', className)}>
      {title && (
        <Title headingLevel="h5" className="graph-title">
          {title}
        </Title>
      )}
      {children}
    </div>
  ),
);

type PrometheusGraphLinkProps = {
  canAccessMonitoring: boolean;
  query: string | string[];
  namespace?: string;
  ariaChartLinkLabel?: string;
};

type PrometheusGraphProps = {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  title?: string;
};
