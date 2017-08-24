import {connect} from 'react-redux';
import * as Immutable from 'immutable';

import { coFetchJSON } from './co-fetch';
import { CONST } from './const';

export const FLAGS = {
  AUTH_ENABLED: 'AUTH_ENABLED',
  CLUSTER_UPDATES: 'CLUSTER_UPDATES',
  RBAC: 'RBAC',
  REVOKE_TOKEN: 'REVOKE_TOKEN',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  ETCD_OPERATOR: 'ETCD_OPERATOR',
  PROMETHEUS: 'PROMETHEUS',
  MULTI_CLUSTER: 'MULTI_CLUSTER',
  SECURITY_LABELLER: 'SECURITY_LABELLER',
};

const DEFAULTS = {
  [FLAGS.AUTH_ENABLED]: !window.SERVER_FLAGS.authDisabled,
  [FLAGS.CLUSTER_UPDATES]: undefined,
  [FLAGS.RBAC]: undefined,
  [FLAGS.REVOKE_TOKEN]: !!window.SERVER_FLAGS.kubectlClientID,
  [FLAGS.USER_MANAGEMENT]: undefined,
  [FLAGS.ETCD_OPERATOR]: undefined,
  [FLAGS.PROMETHEUS]: undefined,
  [FLAGS.MULTI_CLUSTER]: undefined,
  [FLAGS.SECURITY_LABELLER]: undefined,
};

const SET_FLAGS = 'SET_FLAGS';
const setFlags = (dispatch, flags) => dispatch({flags, type: SET_FLAGS});

//These flags are currently being set on the client side for Phase 0 of this
//feature, the plan is to move them to the backend eventually.
const determineMultiClusterFlag = () => {
  const fedApiUrl = localStorage.getItem('federation-apiserver-url') || null;
  const token = localStorage.getItem('federation-apiserver-token') || null;

  if (fedApiUrl && token) {
    return {
      [FLAGS.MULTI_CLUSTER]: {
        'federation-apiserver-url': fedApiUrl,
        'federation-apiserver-token': token,
      }
    };
  }
  return { [FLAGS.MULTI_CLUSTER]: undefined };
};

const K8S_FLAGS = {
  [FLAGS.RBAC]: '/apis/rbac.authorization.k8s.io',
};

const TCO_FLAGS = {
  [FLAGS.CLUSTER_UPDATES]: 'channeloperatorconfigs',
};

const ETCD_OPERATOR_FLAGS = {
  [FLAGS.ETCD_OPERATOR]: 'clusters',
};

const PROMETHEUS_FLAGS = {
  [FLAGS.PROMETHEUS]: 'prometheuses',
};

const SECURITY_LABELLER_FLAGS = {
  [FLAGS.SECURITY_LABELLER]: CONST.SECURITY_LABELLER_NAME,
};

const detectK8sFlags = basePath => dispatch => coFetchJSON(basePath)
  .then(res => setFlags(dispatch, _.mapValues(K8S_FLAGS, path => res.paths.indexOf(path) >= 0)),
    () => setTimeout(() => detectK8sFlags(basePath), 5000));

const detectTectonicChannelOperatorFlags = tcoPath => dispatch => coFetchJSON(tcoPath)
  .then(res => setFlags(dispatch, _.mapValues(TCO_FLAGS, name => _.find(res.resources, {name}))),
    () => setTimeout(() => detectTectonicChannelOperatorFlags(tcoPath), 5000));

const detectEtcdOperatorFlags = etcdPath => dispatch => coFetchJSON(etcdPath)
  .then(res => setFlags(dispatch, _.mapValues(ETCD_OPERATOR_FLAGS, name => _.find(res.resources, {name}))),
    () => setTimeout(() => detectEtcdOperatorFlags(etcdPath), 5000));

const detectPrometheusFlags = monitoringPath => dispatch => coFetchJSON(monitoringPath)
  .then(res => setFlags(dispatch, _.mapValues(PROMETHEUS_FLAGS, name => _.find(res.resources, {name}))),
    () => setTimeout(() => detectPrometheusFlags(monitoringPath), 5000));

const detectMultiClusterFlags = () => dispatch => {
  const multiCluster = determineMultiClusterFlag();
  setFlags(dispatch, multiCluster);
};

const detectSecurityLabellerFlags = labellerDeploymentPath => dispatch => coFetchJSON(labellerDeploymentPath)
  .then(res => setFlags(dispatch, _.mapValues(SECURITY_LABELLER_FLAGS, name => _.find(_.map(res.items, item => item.metadata), {name}))),
    () => setTimeout(() => detectSecurityLabellerFlags(labellerDeploymentPath), 5000));

export const featureActions = {
  detectK8sFlags,
  detectTectonicChannelOperatorFlags,
  detectEtcdOperatorFlags,
  detectPrometheusFlags,
  detectMultiClusterFlags,
  detectSecurityLabellerFlags
};

export const featureReducerName = 'FLAGS';
export const featureReducers = (state, action) => {
  if (!state) {
    return Immutable.Map(DEFAULTS);
  }

  if (action.type === SET_FLAGS) {
    _.each(action.flags, (v, k) => {
      if (!FLAGS[k]) {
        throw new Error(`unknown key for reducer ${k}`);
      }
    });
    return state.merge(action.flags);
  }
  return state;
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
