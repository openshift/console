import * as React from 'react';

import { AsyncComponent } from '../utils/async';

import { FLAGS, connectToFlags, flagPending } from '../../features';
export { Status, errorStatus } from './status';

export const prometheusBasePath = window.SERVER_FLAGS.prometheusBaseURL;

export const Bar = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Bar)} {...props} />;
export const Gauge = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Gauge)} {...props} />;
export const Line = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Line)} {...props} />;
export const Scalar = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Scalar)} {...props} />;
export const Donut = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Donut)} {...props} />;

const canAccessPrometheus = (openshiftFlag, prometheusFlag, canListNS) => {
  if (flagPending(prometheusFlag) || flagPending(openshiftFlag)) {
    // Wait for feature detection to complete before showing graphs so we don't show them, then hide them.
    return false;
  }

  if (!prometheusFlag) {
    return false;
  }

  if (!openshiftFlag) {
    // Charts should be available for Tectonic if the Prometheus flag is on. OpenShift needs additional checks.
    return true;
  }

  if (!window.SERVER_FLAGS.prometheusBaseURL) {
    // Proxy has not been set up for OpenShift. (This can happen if running off-cluster.)
    return false;
  }

  // In OpenShift, the user must be able to list namespaces to query Prometheus.
  return canListNS;
};

// HOC that will hide WrappedComponent when Prometheus isn't configured or the user doesn't have permission to query Prometheus.
/** @type {(WrappedComponent: React.SFC<P>) => React.ComponentType<P & {isOpenShift: boolean}>} */
export const requirePrometheus = WrappedComponent => connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROMETHEUS, FLAGS.CAN_LIST_NS)(props => {
  const { flags } = props;
  const openshiftFlag = flags[FLAGS.OPENSHIFT];
  const prometheusFlag = flags[FLAGS.PROMETHEUS];
  const canListNS = flags[FLAGS.CAN_LIST_NS];
  if (!canAccessPrometheus(openshiftFlag, prometheusFlag, canListNS)) {
    return null;
  }

  return <WrappedComponent isOpenShift={openshiftFlag} {...props} />;
});
