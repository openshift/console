import * as React from 'react';

import { AsyncComponent } from '../utils/async';
import { connectToFlags } from '../../reducers/features';
import { FLAGS } from '../../const';

export { errorStatus, Status } from './status';

export const PROMETHEUS_BASE_PATH = window.SERVER_FLAGS.prometheusBaseURL;
export const PROMETHEUS_TENANCY_BASE_PATH = window.SERVER_FLAGS.prometheusTenancyBaseURL;
export const ALERT_MANAGER_BASE_PATH = window.SERVER_FLAGS.alertManagerBaseURL;

export const Area = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Area)} {...props} />;
export const Bar = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Bar)} {...props} />;
export const Donut = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Donut)} {...props} />;
export const Gauge = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Gauge)} {...props} />;
export const Line = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Line)} {...props} />;
export const QueryBrowser = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.QueryBrowser)} {...props} />;

const canAccessPrometheus = (prometheusFlag) => prometheusFlag && !!PROMETHEUS_BASE_PATH && !!PROMETHEUS_TENANCY_BASE_PATH;

// HOC that will hide WrappedComponent when Prometheus isn't configured or the user doesn't have permission to query Prometheus.
/** @type {(WrappedComponent: React.SFC<P>) => React.ComponentType<P>} */
export const requirePrometheus = WrappedComponent => connectToFlags(FLAGS.PROMETHEUS)(
  ({ flags, ...rest }) => {
    const prometheusFlag = flags[FLAGS.PROMETHEUS];
    if (!canAccessPrometheus(prometheusFlag)) {
      return null;
    }

    return <WrappedComponent {...rest} />;
  }
);
