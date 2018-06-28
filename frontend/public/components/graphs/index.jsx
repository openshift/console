import * as React from 'react';

import { AsyncComponent } from '../utils/async';
import { k8sBasePath } from '../../module/k8s';

import { FLAGS, connectToFlags } from '../../features';
export { Status, errorStatus } from './status';

// Use the prometheus proxy if set up for OpenShift. Otherwise, fall back to the k8s API proxy for Tectonic installs.
export const prometheusBasePath = window.SERVER_FLAGS.prometheusBaseURL
  ? window.SERVER_FLAGS.prometheusBaseURL.replace(/\/$/, '')
  : `${k8sBasePath}/api/v1/proxy/namespaces/tectonic-system/services/prometheus:9090`;

export const Bar = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Bar)} {...props} />;
export const Gauge = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Gauge)} {...props} />;
export const Line = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Line)} {...props} />;
export const Scalar = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Scalar)} {...props} />;
export const Donut = props => <AsyncComponent loader={() => import('./graph-loader').then(c => c.Donut)} {...props} />;

const canAccessPrometheus = (openshiftFlag, prometheusFlag, canListNS) => {
  if (prometheusFlag === undefined || openshiftFlag === undefined) {
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
