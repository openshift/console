import * as React from 'react';

import { AsyncComponent } from '../utils/async';

import { FLAGS, connectToFlags } from '../../features';
export { Status, errorStatus } from './status';

export const prometheusBasePath = window.SERVER_FLAGS.prometheusBaseURL;
export const prometheusTenancyBasePath = window.SERVER_FLAGS.prometheusTenancyBaseURL;
export const alertManagerBasePath = window.SERVER_FLAGS.alertManagerBaseURL;

export const Area = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Area)} {...props} />;
export const Bar = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Bar)} {...props} />;
export const Donut = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Donut)} {...props} />;
export const Gauge = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Gauge)} {...props} />;
export const Line = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Line)} {...props} />;
export const QueryBrowser = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.QueryBrowser)} {...props} />;

const canAccessPrometheus = (prometheusFlag) => prometheusFlag && !!prometheusBasePath && !!prometheusTenancyBasePath;

// HOC that will hide WrappedComponent when Prometheus isn't configured or the user doesn't have permission to query Prometheus.
/** @type {(WrappedComponent: React.SFC<P>) => React.ComponentType<P>} */
export const requirePrometheus = WrappedComponent => connectToFlags(FLAGS.PROMETHEUS)(props => {
  const { flags } = props;
  const prometheusFlag = flags[FLAGS.PROMETHEUS];
  if (!canAccessPrometheus(prometheusFlag)) {
    return null;
  }

  return <WrappedComponent {...props} />;
});
