/* eslint-disable no-undef, no-unused-vars */

import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { SelfSubjectAccessReviewModel, PrometheusModel, ClusterServiceVersionModel, ClusterModel, ChargebackReportModel, ClusterServiceClassModel, VirtualMachineModel, PackageManifestModel } from './models';
import { k8sBasePath, referenceForModel } from './module/k8s/k8s';
import { k8sCreate } from './module/k8s/resource';
import { types } from './module/k8s/k8s-actions';
import { coFetchJSON } from './co-fetch';
import { UIActions } from './ui/ui-actions';

/* global
  FLAGS: false,
  AUTH_ENABLED: false,
  PROMETHEUS: false,
  MULTI_CLUSTER: false,
  OPERATOR_LIFECYCLE_MANAGER: false,
  CALICO: false,
  CHARGEBACK: false,
  OPENSHIFT: false,
  CAN_LIST_NS: false,
  CAN_LIST_NODE: false,
  CAN_LIST_PV: false,
  CAN_LIST_STORE: false,
  CAN_LIST_CRD: false,
  CAN_CREATE_PROJECT: false,
  KUBEVIRT: false,
  PROJECTS_AVAILABLE: false,
  SERVICE_CATALOG: false,
 */
export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  PROMETHEUS = 'PROMETHEUS',
  MULTI_CLUSTER = 'MULTI_CLUSTER',
  OPERATOR_LIFECYCLE_MANAGER = 'OPERATOR_LIFECYCLE_MANAGER',
  CALICO = 'CALICO',
  CHARGEBACK = 'CHARGEBACK',
  OPENSHIFT = 'OPENSHIFT',
  CAN_LIST_NS = 'CAN_LIST_NS',
  CAN_LIST_NODE = 'CAN_LIST_NODE',
  CAN_LIST_PV = 'CAN_LIST_PV',
  CAN_LIST_STORE = 'CAN_LIST_STORE',
  CAN_LIST_CRD = 'CAN_LIST_CRD',
  CAN_CREATE_PROJECT = 'CAN_CREATE_PROJECT',
  KUBEVIRT = 'KUBEVIRT',
  PROJECTS_AVAILABLE = 'PROJECTS_AVAILABLE',
  SERVICE_CATALOG = 'SERVICE_CATALOG',
  KUBERNETES_MARKETPLACE = 'KUBERNETES_MARKETPLACE',
}

export const DEFAULTS_ = _.mapValues(FLAGS, flag => flag === FLAGS.AUTH_ENABLED
  ? !(window as any).SERVER_FLAGS.authDisabled
  : undefined
);

export const CRDs = {
  [referenceForModel(PrometheusModel)]: FLAGS.PROMETHEUS,
  [referenceForModel(ClusterModel)]: FLAGS.MULTI_CLUSTER,
  [referenceForModel(ChargebackReportModel)]: FLAGS.CHARGEBACK,
  [referenceForModel(VirtualMachineModel)]: FLAGS.KUBEVIRT,
  [referenceForModel(ClusterServiceClassModel)]: FLAGS.SERVICE_CATALOG,
  [referenceForModel(ClusterServiceVersionModel)]: FLAGS.OPERATOR_LIFECYCLE_MANAGER,
  [referenceForModel(PackageManifestModel)]: FLAGS.KUBERNETES_MARKETPLACE,
};

const SET_FLAG = 'SET_FLAG';
export const setFlag = (dispatch, flag, value) => dispatch({flag, value, type: SET_FLAG});

const retryFlagDetection = (dispatch, cb) => {
  setTimeout(() => cb(dispatch), 15000);
};

const handleError = (res, flag, dispatch, cb) => {
  const status = _.get(res, 'response.status');
  if (_.includes([403, 502], status)) {
    setFlag(dispatch, flag, undefined);
  }
  if (!_.includes([401, 403, 500], status)) {
    retryFlagDetection(dispatch, cb);
  }
};

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

const projectListPath = `${k8sBasePath}/apis/project.openshift.io/v1/projects?limit=1`;
const detectProjectsAvailable = dispatch => coFetchJSON(projectListPath)
  .then(
    res => setFlag(dispatch, FLAGS.PROJECTS_AVAILABLE, !_.isEmpty(res.items)),
    err => _.get(err, 'response.status') === 404
      ? setFlag(dispatch, FLAGS.PROJECTS_AVAILABLE, false)
      : handleError(err, FLAGS.PROJECTS_AVAILABLE, dispatch, detectProjectsAvailable)
  );

const projectRequestPath = `${k8sBasePath}/apis/project.openshift.io/v1/projectrequests`;
const detectCanCreateProject = dispatch => coFetchJSON(projectRequestPath)
  .then(
    res => setFlag(dispatch, FLAGS.CAN_CREATE_PROJECT, res.status === 'Success'),
    err => {
      const status = _.get(err, 'response.status');
      if (status === 403) {
        setFlag(dispatch, FLAGS.CAN_CREATE_PROJECT, false);
        dispatch(UIActions.setCreateProjectMessage(err.message));
      } else if (!_.includes([400, 404, 500], status)) {
        retryFlagDetection(dispatch, detectCanCreateProject);
      }
    }
  );

export let featureActions = [
  detectCalicoFlags,
  detectOpenShift,
  detectProjectsAvailable,
  detectCanCreateProject,
];

// generate additional featureActions
[
  [FLAGS.CAN_LIST_NS, { resource: 'namespaces', verb: 'list' }],
  [FLAGS.CAN_LIST_NODE, { resource: 'nodes', verb: 'list' }],
  [FLAGS.CAN_LIST_PV, { resource: 'persistentvolumes', verb: 'list' }],
  [FLAGS.CAN_LIST_STORE, { group: 'storage.k8s.io', resource: 'storageclasses', verb: 'list' }],
  [FLAGS.CAN_LIST_CRD, { group: 'apiextensions.k8s.io', resource: 'customresourcedefinitions', verb: 'list' }],
].forEach(_.spread((FLAG, resourceAttributes) => {
  const req = {
    spec: { resourceAttributes },
  };
  const fn = (dispatch) => {
    return k8sCreate(SelfSubjectAccessReviewModel, req)
      .then(
        (res) => setFlag(dispatch, FLAG, res.status.allowed),
        (err) => handleError(err, FLAG, dispatch, fn)
      );
  };
  featureActions.push(fn);
}));

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

type WithFlagsProps = {
  flags: {[key: string]: boolean};
};

export type ConnectToFlags = <P extends WithFlagsProps>(...flags: FLAGS[]) => (C: React.ComponentType<P>) =>
  React.ComponentType<Omit<P, keyof WithFlagsProps>> & {WrappedComponent: React.ComponentType<P>};
export const connectToFlags: ConnectToFlags = (...flags) => connect(state => stateToProps(flags, state));

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = flag => flag === undefined;
