import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { SelfSubjectAccessReviewModel, ChannelOperatorConfigModel, PrometheusModel, ClusterServiceVersionModel, ClusterModel, ChargebackReportModel } from './models';
import { k8sBasePath, referenceForModel } from './module/k8s/k8s';
import { k8sCreate } from './module/k8s/resource';
import { types } from './module/k8s/k8s-actions';
import { coFetchJSON } from './co-fetch';

/* global
  FLAGS: false,
  AUTH_ENABLED: false,
  CLUSTER_UPDATES: false,
  PROMETHEUS: false,
  MULTI_CLUSTER: false,
  SECURITY_LABELLER: false,
  CLOUD_SERVICES: false,
  CALICO: false,
  CHARGEBACK: false,
  OPENSHIFT: false,
  CAN_LIST_NS: false,
 */
export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  CLUSTER_UPDATES = 'CLUSTER_UPDATES',
  PROMETHEUS = 'PROMETHEUS',
  MULTI_CLUSTER = 'MULTI_CLUSTER',
  SECURITY_LABELLER = 'SECURITY_LABELLER',
  CLOUD_SERVICES = 'CLOUD_SERVICES',
  CALICO = 'CALICO',
  CHARGEBACK = 'CHARGEBACK',
  OPENSHIFT = 'OPENSHIFT',
  CAN_LIST_NS = 'CAN_LIST_NS',
}

export const DEFAULTS_ = _.mapValues(FLAGS, flag => flag === FLAGS.AUTH_ENABLED
  ? !(window as any).SERVER_FLAGS.authDisabled
  : undefined
);

export const CRDs = {
  [referenceForModel(ChannelOperatorConfigModel)]: FLAGS.CLUSTER_UPDATES,
  [referenceForModel(PrometheusModel)]: FLAGS.PROMETHEUS,
  // FIXME(alecmerdler): This should look for OLM+Catalog deployments instead of CRD
  [referenceForModel(ClusterServiceVersionModel)]: FLAGS.CLOUD_SERVICES,
  [referenceForModel(ClusterModel)]: FLAGS.MULTI_CLUSTER,
  [referenceForModel(ChargebackReportModel)]: FLAGS.CHARGEBACK,
};

const SET_FLAG = 'SET_FLAG';
const setFlag = (dispatch, flag, value) => dispatch({flag, value, type: SET_FLAG});

const handleError = (res, flag, dispatch, cb) => {
  const status = _.get(res, 'response.status');
  if (status === 403 || status === 502) {
    setFlag(dispatch, flag, undefined);
  }
  if (!_.includes([401, 403, 500], status)) {
    setTimeout(() => cb(dispatch), 15000);
  }
};

const labellerDeploymentPath = `${k8sBasePath}/apis/apps/v1/deployments?fieldSelector=metadata.name%3Dsecurity-labeller-app`;
const detectSecurityLabellerFlags = dispatch => coFetchJSON(labellerDeploymentPath)
  .then(
    res => setFlag(dispatch, FLAGS.SECURITY_LABELLER, _.size(res.items) > 0),
    err => handleError(err, FLAGS.SECURITY_LABELLER, dispatch, detectSecurityLabellerFlags)
  );

const calicoDaemonSetPath = `${k8sBasePath}/apis/apps/v1/daemonsets?fieldSelector=metadata.name%3Dkube-calico`;
const detectCalicoFlags = dispatch => coFetchJSON(calicoDaemonSetPath)
  .then(
    res => setFlag(dispatch, FLAGS.CALICO, _.size(res.items) > 0),
    err => handleError(err, FLAGS.CALICO, dispatch, detectCalicoFlags)
  );

// FIXME: /oapi is deprecated. What else can we use to detect OpenShift?
const openshiftPath = `${k8sBasePath}/oapi/v1`;
const detectOpenShift = dispatch => coFetchJSON(openshiftPath)
  .then(
    res => setFlag(dispatch, FLAGS.OPENSHIFT, _.size(res.resources) > 0),
    err => _.get(err, 'response.status') === 404
      ? setFlag(dispatch, FLAGS.OPENSHIFT, false)
      : handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift)
  );

const detectCanListNS = dispatch => {
  const req = {
    spec: {
      resourceAttributes: {
        resource: 'namespaces',
        verb: 'list',
      },
    },
  };
  k8sCreate(SelfSubjectAccessReviewModel, req)
    .then(
      res => setFlag(dispatch, FLAGS.CAN_LIST_NS, res.status.allowed),
      err => handleError(err, FLAGS.CAN_LIST_NS, dispatch, detectCanListNS)
    );
};

export const featureActions = {
  detectSecurityLabellerFlags,
  detectCalicoFlags,
  detectOpenShift,
  detectCanListNS,
};

export const featureReducerName = 'FLAGS';
export const featureReducer = (state: ImmutableMap<string, any>, action) => {
  if (!state) {
    return ImmutableMap(DEFAULTS_);
  }

  switch (action.type) {
    case SET_FLAG:
      if (!FLAGS[action.flag]) {
        throw new Error(`unknown key for reducer ${action.flag}`);
      }
      return state.merge({[action.flag]: action.value});

    case types.resources:
      // Flip all flags to false to signify that we did not see them
      _.each(CRDs, v => state = state.set(v, false));

      return action.resources.models.filter(model => CRDs[referenceForModel(model)] !== undefined)
        .reduce((nextState, model) => {
          const flag = CRDs[referenceForModel(model)];
          // eslint-disable-next-line no-console
          console.log(`${flag} was detected.`);

          return nextState.set(flag, true);
        }, state);

    default:
      return state;
  }
};

export const stateToProps = (desiredFlags: string[], state) => {
  const flags = desiredFlags.reduce((allFlags, f) => ({...allFlags, [f]: state[featureReducerName].get(f)}), {});
  return {flags};
};

export const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign({}, ownProps, stateProps, dispatchProps);

export const areStatesEqual = (next, previous) => next.FLAGS.equals(previous.FLAGS) &&
  next.UI.get('activeNamespace') === previous.UI.get('activeNamespace') &&
  next.UI.get('location') === previous.UI.get('location');

export const connectToFlags = (...flags) => connect(state => stateToProps(flags, state));
