import { Dispatch } from 'react-redux';
import * as _ from 'lodash-es';
import { ActionType as Action, action } from 'typesafe-actions';

import { OperatorGroupModel, PackageManifestModel, SelfSubjectAccessReviewModel } from '../models';
import { k8sBasePath, ClusterVersionKind, k8sCreate } from '../module/k8s';
import { receivedResources } from './k8s';
import { coFetchJSON } from '../co-fetch';
import { MonitoringRoutes } from '../reducers/monitoring';
import { setMonitoringURL } from './monitoring';
import { setConsoleLinks, setCreateProjectMessage, setUser } from './ui';
import { FLAGS } from '../const';

export enum ActionType {
  SetFlag = 'setFlag',
}

export const defaults = _.mapValues(FLAGS, flag => flag === FLAGS.AUTH_ENABLED
  ? !window.SERVER_FLAGS.authDisabled
  : undefined
);

export const setFlag = (flag: FLAGS, value: boolean) => action(ActionType.SetFlag, {flag, value});

const featureActions = {setFlag};

export type FeatureAction = Action<typeof featureActions | typeof receivedResources>;

const retryFlagDetection = (dispatch, cb) => {
  setTimeout(() => cb(dispatch), 15000);
};

const handleError = (res, flag, dispatch, cb) => {
  const status = _.get(res, 'response.status');
  if (_.includes([403, 502], status)) {
    dispatch(setFlag(flag, undefined));
  }
  if (!_.includes([401, 403, 500], status)) {
    retryFlagDetection(dispatch, cb);
  }
};

const openshiftPath = `${k8sBasePath}/apis/apps.openshift.io/v1`;
const detectOpenShift = dispatch => coFetchJSON(openshiftPath)
  .then(
    res => dispatch(setFlag(FLAGS.OPENSHIFT, _.size(res.resources) > 0)),
    err => _.get(err, 'response.status') === 404
      ? dispatch(setFlag(FLAGS.OPENSHIFT, false))
      : handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift)
  );

const clusterVersionPath = `${k8sBasePath}/apis/config.openshift.io/v1/clusterversions/version`;
const detectClusterVersion = dispatch => coFetchJSON(clusterVersionPath)
  .then(
    (clusterVersion: ClusterVersionKind) => {
      const hasClusterVersion = !_.isEmpty(clusterVersion);
      dispatch(setFlag(FLAGS.CLUSTER_VERSION, hasClusterVersion));
    },
    err => {
      if (_.includes([403, 404], _.get(err, 'response.status'))) {
        dispatch(setFlag(FLAGS.CLUSTER_VERSION, false));
      } else {
        handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift);
      }
    });

const projectRequestPath = `${k8sBasePath}/apis/project.openshift.io/v1/projectrequests`;
const detectCanCreateProject = dispatch => coFetchJSON(projectRequestPath)
  .then(
    res => dispatch(setFlag(FLAGS.CAN_CREATE_PROJECT, res.status === 'Success')),
    err => {
      const status = _.get(err, 'response.status');
      if (status === 403) {
        dispatch(setFlag(FLAGS.CAN_CREATE_PROJECT, false));
        dispatch(setCreateProjectMessage(err.message));
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
      dispatch(setUser(user));
    },
    err => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectUser(dispatch), 15000);
      }
    },
  );

const detectConsoleLinks = dispatch => coFetchJSON('api/kubernetes/apis/console.openshift.io/v1/consolelinks')
  .then(
    (consoleLinks) => {
      dispatch(setConsoleLinks(_.get(consoleLinks, 'items')));
    },
    err => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectConsoleLinks(dispatch), 15000);
      }
    },
  );

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
    dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, false));
    return;
  }

  coFetchJSON(projectListPath)
    .then(
      res => dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, _.isEmpty(res.items))),
      err => _.get(err, 'response.status') === 404
        ? dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, false))
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

const ssarCheckActions = ssarChecks.map(({flag, resourceAttributes, after}) => {
  const req = {
    spec: { resourceAttributes },
  };
  const fn = (dispatch) => {
    return k8sCreate(SelfSubjectAccessReviewModel, req) .then((res) => {
      const allowed: boolean = res.status.allowed;
      dispatch(setFlag(flag, allowed));
      if (after) {
        after(dispatch, allowed);
      }
    }, (err) => handleError(err, flag, dispatch, fn));
  };
  return fn;
});

export const detectFeatures = () => (dispatch: Dispatch) => [
  detectOpenShift,
  detectCanCreateProject,
  detectMonitoringURLs,
  detectClusterVersion,
  detectUser,
  detectLoggingURL,
  detectConsoleLinks,
  ...ssarCheckActions,
].forEach(detect => detect(dispatch));
