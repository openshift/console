import { connect } from 'react-redux';
import * as Immutable from 'immutable';
import * as _ from 'lodash';

import { k8sBasePath } from './module/k8s';
import { coFetchJSON } from './co-fetch';

/* global
  FLAGS: false,
  AUTH_ENABLED: false,
  CLUSTER_UPDATES: false,
  PROMETHEUS: false,
  MULTI_CLUSTER: false,
  SECURITY_LABELLER: false,
  CLOUD_SERVICES: false,
  CLOUD_CATALOGS: false,
  CALICO: false,
  CHARGEBACK: false,
 */
export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  CLUSTER_UPDATES = 'CLUSTER_UPDATES',
  PROMETHEUS = 'PROMETHEUS',
  MULTI_CLUSTER = 'MULTI_CLUSTER',
  SECURITY_LABELLER = 'SECURITY_LABELLER',
  CLOUD_SERVICES = 'CLOUD_SERVICES',
  CLOUD_CATALOGS = 'CLOUD_CATALOGS',
  CALICO = 'CALICO',
  CHARGEBACK = 'CHARGEBACK',
}

const DEFAULTS = {
  [FLAGS.AUTH_ENABLED]: !(window as any).SERVER_FLAGS.authDisabled,
  [FLAGS.CLUSTER_UPDATES]: undefined,
  [FLAGS.PROMETHEUS]: undefined,
  [FLAGS.MULTI_CLUSTER]: undefined,
  [FLAGS.SECURITY_LABELLER]: undefined,
  [FLAGS.CLOUD_SERVICES]: undefined,
  [FLAGS.CLOUD_CATALOGS]: undefined,
  [FLAGS.CALICO]: undefined,
  [FLAGS.CHARGEBACK]: undefined,
};

const SET_FLAGS = 'SET_FLAGS';
const setFlags = (dispatch, flags) => dispatch({flags, type: SET_FLAGS});

const handleError = (res, flags, dispatch, cb) => {
  const status = _.get(res, 'response.status');
  if (status === 403 || status === 502) {
    setFlags(dispatch, _.mapValues(flags, () => undefined));
  } else {
    setTimeout(() => cb(dispatch), 15000);
  }
};

const SECURITY_LABELLER_FLAGS = {
  [FLAGS.SECURITY_LABELLER]: 'security-labeller-app',
};

const CALICO_FLAGS = {
  [FLAGS.CALICO]: 'kube-calico',
};

export const CRDS_ = {
  'channeloperatorconfigs.tco.coreos.com': FLAGS.CLUSTER_UPDATES,
  'prometheuses.monitoring.coreos.com': FLAGS.PROMETHEUS,
  'clusterserviceversion-v1s.app.coreos.com': FLAGS.CLOUD_SERVICES,
  'uicatalogentry-v1s.app.coreos.com': FLAGS.CLOUD_CATALOGS,
  'clusters.multicluster.coreos.com': FLAGS.MULTI_CLUSTER,
  'reports.chargeback.coreos.com': FLAGS.CHARGEBACK,
};

const labellerDeploymentPath = `${k8sBasePath}/apis/apps/v1beta2/deployments`;
const detectSecurityLabellerFlags = dispatch => coFetchJSON(labellerDeploymentPath)
  .then(res => setFlags(dispatch, _.mapValues(SECURITY_LABELLER_FLAGS, name => _.find(_.map(res.items, (item: any) => item.metadata), {name}))),
    (res) => handleError(res, SECURITY_LABELLER_FLAGS, dispatch, detectSecurityLabellerFlags));

const calicoDaemonSetPath = `${k8sBasePath}/apis/apps/v1beta2/daemonsets`;
const detectCalicoFlags = dispatch => coFetchJSON(calicoDaemonSetPath)
  .then(res => setFlags(dispatch, _.mapValues(CALICO_FLAGS, name => _.find(_.map(res.items, (item: any) => item.metadata), {name}))),
    (res) => handleError(res, CALICO_FLAGS, dispatch, detectCalicoFlags));


export const featureActions = {
  detectSecurityLabellerFlags,
  detectCalicoFlags,
};

export const featureReducerName = 'FLAGS';
export const featureReducer = (state, action) => {
  if (!state) {
    return Immutable.Map(DEFAULTS);
  }

  switch (action.type) {
    case SET_FLAGS:
      _.each(action.flags, (v, k) => {
        if (!FLAGS[k]) {
          throw new Error(`unknown key for reducer ${k}`);
        }
      });
      return state.merge(action.flags);
    case 'addCRDs':
      _.each(action.kinds, (k: any) => {
        const flag = CRDS_[k.metadata.name];
        if (!flag) {
          return;
        }
        // eslint-disable-next-line no-console
        console.log(`${flag} was detected.`);
        state = state.set(flag, true);
      });
      return state;
    default:
      return state;
  }
};

export const stateToProps = (flags, state) => {
  const props = {flags: {}};
  _.each(flags, f => {
    props.flags[f] = _.get(state[featureReducerName].toJSON(), f);
  });
  return props;
};

export const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign({}, ownProps, stateProps, dispatchProps);

export const areStatesEqual = (next, previous) => next.FLAGS.equals(previous.FLAGS) &&
  next.UI.get('activeNamespace') === previous.UI.get('activeNamespace') &&
  next.UI.get('location') === previous.UI.get('location');

export const connectToFlags = (...flags) => connect(state => stateToProps(flags, state));
