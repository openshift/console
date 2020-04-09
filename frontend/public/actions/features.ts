import { Dispatch } from 'react-redux';
import * as _ from 'lodash-es';
import { ActionType as Action, action } from 'typesafe-actions';
import { getInfrastructurePlatform } from '@console/shared/src/selectors';
import {
  GroupModel,
  InfrastructureModel,
  SelfSubjectAccessReviewModel,
  UserModel,
} from '../models';
import { k8sBasePath, ClusterVersionKind, k8sCreate, k8sGet, K8sResourceKind } from '../module/k8s';
import { receivedResources } from './k8s';
import { coFetchJSON } from '../co-fetch';
import { MonitoringRoutes } from '../reducers/monitoring';
import { setMonitoringURL } from './monitoring';
import { setClusterID, setConsoleLinks, setCreateProjectMessage, setUser } from './ui';
import { FLAGS } from '../const';

export enum ActionType {
  SetFlag = 'setFlag',
  ClearSSARFlags = 'clearSSARFlags',
}

export const defaults = _.mapValues(FLAGS, (flag) =>
  flag === FLAGS.AUTH_ENABLED ? !window.SERVER_FLAGS.authDisabled : undefined,
);

export const setFlag = (flag: FLAGS, value: boolean) => action(ActionType.SetFlag, { flag, value });

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

  coFetchJSON(projectListPath).then(
    (res) => dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, _.isEmpty(res.items))),
    (err) =>
      _.get(err, 'response.status') === 404
        ? dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, false))
        : handleError(
            err,
            FLAGS.SHOW_OPENSHIFT_START_GUIDE,
            dispatch,
            detectShowOpenShiftStartGuide,
          ),
  );
};

// Check the user's access to some resources.
const ssarChecks = [
  {
    flag: FLAGS.CAN_GET_NS,
    resourceAttributes: { resource: 'namespaces', verb: 'get' },
  },
  {
    flag: FLAGS.CAN_LIST_NS,
    resourceAttributes: { resource: 'namespaces', verb: 'list' },
    after: detectShowOpenShiftStartGuide,
  },
  {
    flag: FLAGS.CAN_LIST_NODE,
    resourceAttributes: { resource: 'nodes', verb: 'list' },
  },
  {
    flag: FLAGS.CAN_LIST_PV,
    resourceAttributes: { resource: 'persistentvolumes', verb: 'list' },
  },
  {
    flag: FLAGS.CAN_LIST_USERS,
    resourceAttributes: {
      group: UserModel.apiGroup,
      resource: UserModel.plural,
      verb: 'list',
    },
  },
  {
    flag: FLAGS.CAN_LIST_GROUPS,
    resourceAttributes: {
      group: GroupModel.apiGroup,
      resource: GroupModel.plural,
      verb: 'list',
    },
  },
  {
    flag: FLAGS.CAN_LIST_CRD,
    resourceAttributes: {
      group: 'apiextensions.k8s.io',
      resource: 'customresourcedefinitions',
      verb: 'list',
    },
  },
  {
    // TODO: Move into OLM plugin
    flag: FLAGS.CAN_LIST_OPERATOR_GROUP,
    resourceAttributes: {
      group: 'operators.coreos.com',
      resource: 'operatorgroups',
      verb: 'list',
    },
  },
  {
    // TODO: Move into OLM plugin
    flag: FLAGS.CAN_LIST_PACKAGE_MANIFEST,
    resourceAttributes: {
      group: 'packages.operators.coreos.com',
      resource: 'packagemanifests',
      verb: 'list',
    },
  },
  {
    flag: FLAGS.CAN_LIST_CHARGEBACK_REPORTS,
    resourceAttributes: {
      group: 'metering.openshift.io',
      resource: 'reports',
      namespace: 'openshift-metering',
      verb: 'list',
    },
  },
];

export const clearSSARFlags = () =>
  action(ActionType.ClearSSARFlags, {
    flags: ssarChecks.map((check) => check.flag),
  });

const featureActions = { setFlag };
const clearFlags = { clearSSARFlags };

export type FeatureAction = Action<
  typeof featureActions | typeof receivedResources | typeof clearFlags
>;

const openshiftPath = `${k8sBasePath}/apis/apps.openshift.io/v1`;
const detectOpenShift = (dispatch) =>
  coFetchJSON(openshiftPath).then(
    (res) => dispatch(setFlag(FLAGS.OPENSHIFT, _.size(res.resources) > 0)),
    (err) =>
      _.get(err, 'response.status') === 404
        ? dispatch(setFlag(FLAGS.OPENSHIFT, false))
        : handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift),
  );

const detectBaremetalPlatform = (dispatch) =>
  k8sGet(InfrastructureModel, 'cluster').then(
    (infra: K8sResourceKind) =>
      dispatch(setFlag(FLAGS.BAREMETAL, getInfrastructurePlatform(infra) === 'BareMetal')),
    (err) => {
      _.get(err, 'response.status') === 404
        ? dispatch(setFlag(FLAGS.BAREMETAL, false))
        : handleError(err, FLAGS.BAREMETAL, dispatch, detectBaremetalPlatform);
    },
  );

const clusterVersionPath = `${k8sBasePath}/apis/config.openshift.io/v1/clusterversions/version`;
const detectClusterVersion = (dispatch) =>
  coFetchJSON(clusterVersionPath).then(
    (clusterVersion: ClusterVersionKind) => {
      const hasClusterVersion = !_.isEmpty(clusterVersion);
      dispatch(setFlag(FLAGS.CLUSTER_VERSION, hasClusterVersion));
      dispatch(setClusterID(clusterVersion.spec.clusterID));
    },
    (err) => {
      if (_.includes([403, 404], _.get(err, 'response.status'))) {
        dispatch(setFlag(FLAGS.CLUSTER_VERSION, false));
      } else {
        handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift);
      }
    },
  );

const projectRequestPath = `${k8sBasePath}/apis/project.openshift.io/v1/projectrequests`;
const detectCanCreateProject = (dispatch) =>
  coFetchJSON(projectRequestPath).then(
    (res) => dispatch(setFlag(FLAGS.CAN_CREATE_PROJECT, res.status === 'Success')),
    (err) => {
      const status = _.get(err, 'response.status');
      if (status === 403) {
        dispatch(setFlag(FLAGS.CAN_CREATE_PROJECT, false));
        dispatch(setCreateProjectMessage(_.get(err, 'json.details.causes[0].message')));
      } else if (!_.includes([400, 404, 500], status)) {
        retryFlagDetection(dispatch, detectCanCreateProject);
      }
    },
  );

const monitoringConfigMapPath = `${k8sBasePath}/api/v1/namespaces/openshift-monitoring/configmaps/sharing-config`;
const detectMonitoringURLs = (dispatch) =>
  coFetchJSON(monitoringConfigMapPath).then(
    (res) => {
      const { alertmanagerURL, grafanaURL, prometheusURL } = res.data;
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
    (err) => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectMonitoringURLs(dispatch), 15000);
      }
    },
  );

const loggingConfigMapPath = `${k8sBasePath}/api/v1/namespaces/openshift-logging/configmaps/sharing-config`;
const detectLoggingURL = (dispatch) =>
  coFetchJSON(loggingConfigMapPath).then(
    (res) => {
      const { kibanaAppURL } = res.data;
      if (!_.isEmpty(kibanaAppURL)) {
        dispatch(setMonitoringURL(MonitoringRoutes.Kibana, kibanaAppURL));
      }
    },
    (err) => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectLoggingURL(dispatch), 15000);
      }
    },
  );

const detectUser = (dispatch) =>
  coFetchJSON('api/kubernetes/apis/user.openshift.io/v1/users/~').then(
    (user) => {
      dispatch(setUser(user));
    },
    (err) => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectUser(dispatch), 15000);
      }
    },
  );

const detectConsoleLinks = (dispatch) =>
  coFetchJSON('api/kubernetes/apis/console.openshift.io/v1/consolelinks').then(
    (consoleLinks) => {
      dispatch(setConsoleLinks(_.get(consoleLinks, 'items')));
    },
    (err) => {
      if (!_.includes([401, 403, 404, 500], _.get(err, 'response.status'))) {
        setTimeout(() => detectConsoleLinks(dispatch), 15000);
      }
    },
  );

const ssarCheckActions = ssarChecks.map(({ flag, resourceAttributes, after }) => {
  const req = {
    spec: { resourceAttributes },
  };
  const fn = (dispatch) => {
    return k8sCreate(SelfSubjectAccessReviewModel, req).then(
      (res) => {
        const allowed: boolean = res.status.allowed;
        dispatch(setFlag(flag, allowed));
        if (after) {
          after(dispatch, allowed);
        }
      },
      (err) => handleError(err, flag, dispatch, fn),
    );
  };
  return fn;
});

export const detectFeatures = () => (dispatch: Dispatch) =>
  [
    detectOpenShift,
    // TODO(vojtech): move this flag definition to metal3-plugin via ActionFeatureFlag extension
    detectBaremetalPlatform,
    detectCanCreateProject,
    detectMonitoringURLs,
    detectClusterVersion,
    detectUser,
    detectLoggingURL,
    detectConsoleLinks,
    ...ssarCheckActions,
  ].forEach((detect) => detect(dispatch));
