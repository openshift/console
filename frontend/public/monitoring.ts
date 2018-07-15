/* eslint-disable no-undef */

import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { k8sBasePath } from './module/k8s/k8s';
import { coFetchJSON } from './co-fetch';

export enum MonitoringRoutes {
  Prometheus = 'prometheus-k8s',
  AlertManager = 'alertmanager-main',
  Grafana = 'grafana',
}

const SET_MONITORING_URL = 'setMonitoringURL';
const DEFAULTS = _.mapValues(MonitoringRoutes, undefined);

const monitoringRoutes = `${k8sBasePath}/apis/route.openshift.io/v1/namespaces/openshift-monitoring/routes/`;
export const detectMonitoringURLs = dispatch => coFetchJSON(monitoringRoutes).then(res => {
  const byName = _.keyBy(res.items, 'metadata.name');
  _.each(MonitoringRoutes, name => {
    const route = byName[name];
    if (!route) {
      return;
    }
    const scheme = _.get(route, 'spec.tls.termination') ? 'https' : 'http';
    const url = `${scheme}://${route.spec.host}`;
    // eslint-disable-next-line no-console
    console.log(`${name} detected at ${url}`);
    dispatch({ name, url, type: SET_MONITORING_URL });
  });
}).catch(res => {
  const status = _.get(res, 'response.status');
  // eslint-disable-next-line no-console
  console.log('Could not get openshift-monitoring routes, status:', status);
  if (!_.includes([401, 403, 404, 500], status)) {
    setTimeout(() => detectMonitoringURLs(dispatch), 15000);
  }
});

export const monitoringReducer = (state: ImmutableMap<string, any>, action) => {
  if (!state) {
    return ImmutableMap(DEFAULTS);
  }

  switch (action.type) {
    case SET_MONITORING_URL:
      return state.merge({ [action.name]: action.url });

    default:
      return state;
  }
};

export const monitoringReducerName = 'monitoringURLs';
const stateToProps = (desiredURLs: string[], state) => {
  const urls = desiredURLs.reduce((previous, next) => ({...previous, [next]: state[monitoringReducerName].get(next)}), {});
  return { urls };
};

export const connectToURLs = (...urls) => connect(state => stateToProps(urls, state));
