import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import type { FC, ComponentType, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { Title } from '@patternfly/react-core';

import { FLAGS } from '@console/shared/src/constants/common';
import { featureReducerName } from '../../reducers/features';
import { getActiveNamespace } from '../../reducers/ui';
import { RootState } from '../../redux';

const mapStateToProps = (state: RootState) => ({
  canAccessMonitoring:
    !!state[featureReducerName].get(FLAGS.CAN_GET_NS) && !!window.SERVER_FLAGS.prometheusBaseURL,
  namespace: getActiveNamespace(state),
});

const PrometheusGraphLink_: FC<PrometheusGraphLinkProps> = ({
  children,
  query,
  namespace,
  ariaChartLinkLabel,
}) => {
  const queries = _.compact(_.castArray(query));
  if (!queries.length) {
    return <>{children}</>;
  }

  const params = new URLSearchParams();
  queries.forEach((q, index) => params.set(`query${index}`, q));
  params.set('namespace', namespace);

  const url = `/monitoring/query-browser?${params.toString()}`;

  return (
    <Link
      to={url}
      aria-label={ariaChartLinkLabel}
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      {children}
    </Link>
  );
};
export const PrometheusGraphLink = connect(mapStateToProps)(PrometheusGraphLink_) as ComponentType<
  Omit<PrometheusGraphLinkProps, 'namespace'>
>;

export const PrometheusGraph = forwardRef<HTMLDivElement, PrometheusGraphProps>(
  ({ children, className, title }, ref) => (
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
  query: string | string[];
  namespace?: string;
  ariaChartLinkLabel?: string;
  children?: ReactNode;
};

type PrometheusGraphProps = {
  className?: string;
  ref?: Ref<HTMLDivElement>;
  title?: string;
  children?: ReactNode;
};
