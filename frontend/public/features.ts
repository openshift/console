/* eslint-disable no-undef, no-unused-vars */

import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import {
  ChargebackReportModel,
  ClusterServiceClassModel,
  ClusterServiceVersionModel,
  MachineModel,
  MachineConfigModel,
  OperatorSourceModel,
  PrometheusModel,
  SelfSubjectAccessReviewModel,
  VirtualMachineModel,
  BaremetalHostModel,
  PackageManifestModel,
  OperatorGroupModel,
} from './models';
import { ClusterVersionKind } from './module/k8s';
import { k8sBasePath, referenceForModel } from './module/k8s/k8s';
import { k8sCreate } from './module/k8s/resource';
import { types } from './module/k8s/k8s-actions';
import { coFetchJSON } from './co-fetch';
import { MonitoringRoutes, setMonitoringURL } from './monitoring';
import { UIActions } from './ui/ui-actions';

/* global
  FLAGS: false,
  AUTH_ENABLED: false,
  PROMETHEUS: false,
  OPERATOR_LIFECYCLE_MANAGER: false,
  CHARGEBACK: false,
  OPENSHIFT: false,
  CAN_GET_NS: false,
  CAN_LIST_NS: false,
  CAN_LIST_NODE: false,
  CAN_LIST_PV: false,
  CAN_LIST_STORE: false,
  CAN_LIST_CRD: false,
  CAN_CREATE_PROJECT: false,
  KUBEVIRT: false,
  SHOW_OPENSHIFT_START_GUIDE: false,
  SERVICE_CATALOG: false,
  OPERATOR_HUB: false,
  CLUSTER_API: false,
  CLUSTER_VERSION: false,
  MACHINE_CONFIG: false,
  METALKUBE: false,
 */
export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  PROMETHEUS = 'PROMETHEUS',
  OPERATOR_LIFECYCLE_MANAGER = 'OPERATOR_LIFECYCLE_MANAGER',
  CHARGEBACK = 'CHARGEBACK',
  OPENSHIFT = 'OPENSHIFT',
  CAN_GET_NS = 'CAN_GET_NS',
  CAN_LIST_NS = 'CAN_LIST_NS',
  CAN_LIST_NODE = 'CAN_LIST_NODE',
  CAN_LIST_PV = 'CAN_LIST_PV',
  CAN_LIST_STORE = 'CAN_LIST_STORE',
  CAN_LIST_CRD = 'CAN_LIST_CRD',
  CAN_LIST_PACKAGE_MANIFEST = 'CAN_LIST_PACKAGE_MANIFEST',
  CAN_LIST_OPERATOR_GROUP = 'CAN_LIST_OPERATOR_GROUP',
  CAN_CREATE_PROJECT = 'CAN_CREATE_PROJECT',
  KUBEVIRT = 'KUBEVIRT',
  METALKUBE = 'METALKUBE',
  SHOW_OPENSHIFT_START_GUIDE = 'SHOW_OPENSHIFT_START_GUIDE',
  SERVICE_CATALOG = 'SERVICE_CATALOG',
  OPERATOR_HUB = 'OPERATOR_HUB',
  CLUSTER_API = 'CLUSTER_API',
  CLUSTER_VERSION = 'CLUSTER_VERSION',
  MACHINE_CONFIG = 'MACHINE_CONFIG',
}

export const DEFAULTS_ = _.mapValues(FLAGS, flag => flag === FLAGS.AUTH_ENABLED
  ? !(window as any).SERVER_FLAGS.authDisabled
  : undefined
);

export const CRDs = {
  [referenceForModel(PrometheusModel)]: FLAGS.PROMETHEUS,
  [referenceForModel(ChargebackReportModel)]: FLAGS.CHARGEBACK,
  [referenceForModel(VirtualMachineModel)]: FLAGS.KUBEVIRT,
  [referenceForModel(ClusterServiceClassModel)]: FLAGS.SERVICE_CATALOG,
  [referenceForModel(ClusterServiceVersionModel)]: FLAGS.OPERATOR_LIFECYCLE_MANAGER,
  [referenceForModel(OperatorSourceModel)]: FLAGS.OPERATOR_HUB,
  [referenceForModel(MachineModel)]: FLAGS.CLUSTER_API,
  [referenceForModel(MachineConfigModel)]: FLAGS.MACHINE_CONFIG,
  [referenceForModel(BaremetalHostModel)]: FLAGS.METALKUBE,
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

const openshiftPath = `${k8sBasePath}/apis/apps.openshift.io/v1`;
const detectOpenShift = dispatch => coFetchJSON(openshiftPath)
  .then(
    res => setFlag(dispatch, FLAGS.OPENSHIFT, _.size(res.resources) > 0),
    err => _.get(err, 'response.status') === 404
      ? setFlag(dispatch, FLAGS.OPENSHIFT, false)
      : handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift)
  );

const clusterVersionPath = `${k8sBasePath}/apis/config.openshift.io/v1/clusterversions/version`;
const detectClusterVersion = dispatch => coFetchJSON(clusterVersionPath)
  .then(
    (clusterVersion: ClusterVersionKind) => {
      const hasClusterVersion = !_.isEmpty(clusterVersion);
      setFlag(dispatch, FLAGS.CLUSTER_VERSION, hasClusterVersion);

      if (hasClusterVersion && !_.isEmpty(clusterVersion.spec)) {
        dispatch(UIActions.setClusterID(clusterVersion.spec.clusterID));
      }
    },
    err => {
      if (_.includes([403, 404], _.get(err, 'response.status'))) {
        setFlag(dispatch, FLAGS.CLUSTER_VERSION, false);
      } else {
        handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift);
      }
    });

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

const monitoringConfigMapPath = `${k8sBasePath}/api/v1/namespaces/openshift-monitoring/configmaps/sharing-config`;
const detectMonitoringURLs = dispatch => coFetchJSON(monitoringConfigMapPath)
  .then(
    res => {
      const {alertmanagerURL, grafanaURL, prometheusURL} = res.data;
      if (!_.isEmpty(alertmanagerURL)) {
        dispatch(setMonitoringURL(MonitoringRoutes.AlertManager, alertmanagerURL));
      }
      if (!_.isEmpty(grafanaURL)) {
        dispatch(setMonitoringURL(MonitoringRoutes.Grafana, grafanaURL));
      }
      if (!_.isEmpty(prometheusURL)) {
        dispatch(setMonitoringURL(MonitoringRoutes.Prometheus, prometheusURL));
      }
    },
    err => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectMonitoringURLs(dispatch), 15000);
      }
    },
  );

const loggingConfigMapPath = `${k8sBasePath}/api/v1/namespaces/openshift-logging/configmaps/sharing-config`;
const detectLoggingURL = dispatch => coFetchJSON(loggingConfigMapPath)
  .then(
    res => {
      const {kibanaAppURL} = res.data;
      if (!_.isEmpty(kibanaAppURL)) {
        dispatch(setMonitoringURL(MonitoringRoutes.Kibana, kibanaAppURL));
      }
    },
    err => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectLoggingURL(dispatch), 15000);
      }
    },
  );

const detectUser = dispatch => coFetchJSON('api/kubernetes/apis/user.openshift.io/v1/users/~')
  .then(
    (user) => {
      dispatch(UIActions.setUser(user));
    },
    err => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectUser(dispatch), 15000);
      }
    },
  );

export const featureActions = [
  detectOpenShift,
  detectCanCreateProject,
  detectMonitoringURLs,
  detectClusterVersion,
  detectUser,
  detectLoggingURL,
];

const projectListPath = `${k8sBasePath}/apis/project.openshift.io/v1/projects?limit=1`;
const detectShowOpenShiftStartGuide = (dispatch, canListNS: boolean = false) => {
  // Skip the project check if we know the user can list all namespaces. This
  // avoids potentially listing thousands of projects more than once (projects
  // dropdown and flag check). Even though we only ask for one project, the
  // projects API currently doesn't support paging.
  //
  // TODO: Consider adding a global watch for projects / namespaces, which
  // could remove the need for this flag entirely. It would also prevent us
  // from re-listing projects when switching from a namespace-scoped resource
  // to a cluster-scoped resource and back.
  if (canListNS) {
    setFlag(dispatch, FLAGS.SHOW_OPENSHIFT_START_GUIDE, false);
    return;
  }

  coFetchJSON(projectListPath)
    .then(
      res => setFlag(dispatch, FLAGS.SHOW_OPENSHIFT_START_GUIDE, _.isEmpty(res.items)),
      err => _.get(err, 'response.status') === 404
        ? setFlag(dispatch, FLAGS.SHOW_OPENSHIFT_START_GUIDE, false)
        : handleError(err, FLAGS.SHOW_OPENSHIFT_START_GUIDE, dispatch, detectShowOpenShiftStartGuide)
    );
};

// Check the user's access to some resources.
const ssarChecks = [{
  flag: FLAGS.CAN_GET_NS,
  resourceAttributes: { resource: 'namespaces', verb: 'get' },
}, {
  flag: FLAGS.CAN_LIST_NS,
  resourceAttributes: { resource: 'namespaces', verb: 'list' },
  after: detectShowOpenShiftStartGuide,
}, {
  flag: FLAGS.CAN_LIST_NODE,
  resourceAttributes: { resource: 'nodes', verb: 'list' },
}, {
  flag: FLAGS.CAN_LIST_PV,
  resourceAttributes: { resource: 'persistentvolumes', verb: 'list' },
}, {
  flag: FLAGS.CAN_LIST_CRD,
  resourceAttributes:{ group: 'apiextensions.k8s.io', resource: 'customresourcedefinitions', verb: 'list' },
}, {
  flag: FLAGS.CAN_LIST_PACKAGE_MANIFEST,
  resourceAttributes:{ group: PackageManifestModel.apiGroup, resource: PackageManifestModel.plural, verb: 'list'},
}, {
  flag: FLAGS.CAN_LIST_OPERATOR_GROUP,
  resourceAttributes:{ group: OperatorGroupModel.apiGroup, resource: OperatorGroupModel.plural, verb: 'list' },
}];

ssarChecks.forEach(({flag, resourceAttributes, after}) => {
  const req = {
    spec: { resourceAttributes },
  };
  const fn = (dispatch) => {
    return k8sCreate(SelfSubjectAccessReviewModel, req) .then((res) => {
      const allowed: boolean = res.status.allowed;
      setFlag(dispatch, flag, allowed);
      if (after) {
        after(dispatch, allowed);
      }
    }, (err) => handleError(err, flag, dispatch, fn));
  };
  featureActions.push(fn);
});

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
