import { Dispatch } from 'react-redux';
import * as _ from 'lodash-es';
import { ActionType as Action, action } from 'typesafe-actions';

import { FLAGS } from '@console/shared/src/constants/common';
import { isCustomFeatureFlag } from '@console/plugin-sdk/src/typings';
import {
  subscribeToExtensions,
  extensionDiffListener,
} from '@console/plugin-sdk/src/subscribeToExtensions';
import store from '../redux';
import { GroupModel, UserModel, VolumeSnapshotContentModel } from '../models';
import { ClusterVersionKind } from '../module/k8s';
import { receivedResources } from './k8s';
import { pluginStore } from '../plugins';
import { setClusterID, setCreateProjectMessage, setUser } from './common';
import client, { fetchURL } from '../graphql/client';
import { SSARQuery } from './features.gql';
import { SSARQueryType, SSARQueryVariables } from '../../@types/gql/schema';
import {
  ResolvedFeatureFlag as DynamicFeatureFlag,
  isFeatureFlag as isDynamicFeatureFlag,
  SetFeatureFlag,
} from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { executeReferencedFunction } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export enum ActionType {
  SetFlag = 'setFlag',
  ClearSSARFlags = 'clearSSARFlags',
}

export const defaults = _.mapValues(FLAGS, (flag) =>
  flag === FLAGS.AUTH_ENABLED ? !window.SERVER_FLAGS.authDisabled : undefined,
);

export const setFlag = (flag: FLAGS | string, value: boolean) =>
  action(ActionType.SetFlag, { flag, value });

const retryFlagDetection = (dispatch, cb) => {
  setTimeout(() => cb(dispatch), 15000);
};

export const handleError = (res, flag, dispatch, cb) => {
  const status = res?.response?.status;
  if (_.includes([403, 502], status)) {
    dispatch(setFlag(flag, undefined));
  }
  if (!_.includes([401, 403, 500], status)) {
    retryFlagDetection(dispatch, cb);
  }
};

const projectListPath = '/apis/project.openshift.io/v1/projects?limit=1';
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

  fetchURL(projectListPath).then(
    (res) => dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, _.isEmpty(res.items))),
    (err) =>
      err?.response?.status === 404
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
  // TODO: Move into Core Plugin
  {
    flag: FLAGS.CAN_LIST_VSC,
    resourceAttributes: {
      group: VolumeSnapshotContentModel.apiGroup,
      resource: VolumeSnapshotContentModel.plural,
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

const openshiftPath = '/apis/apps.openshift.io/v1';
const detectOpenShift = (dispatch) =>
  fetchURL(openshiftPath).then(
    (res) => dispatch(setFlag(FLAGS.OPENSHIFT, _.size(res.resources) > 0)),
    (err) =>
      err?.response?.status === 404
        ? dispatch(setFlag(FLAGS.OPENSHIFT, false))
        : handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift),
  );

const clusterVersionPath = '/apis/config.openshift.io/v1/clusterversions/version';
const detectClusterVersion = (dispatch) =>
  fetchURL<ClusterVersionKind>(clusterVersionPath).then(
    (clusterVersion) => {
      const hasClusterVersion = !_.isEmpty(clusterVersion);
      dispatch(setFlag(FLAGS.CLUSTER_VERSION, hasClusterVersion));
      dispatch(setClusterID(clusterVersion.spec.clusterID));
    },
    (err) => {
      if (_.includes([403, 404], err?.response?.status)) {
        dispatch(setFlag(FLAGS.CLUSTER_VERSION, false));
      } else {
        handleError(err, FLAGS.CLUSTER_VERSION, dispatch, detectClusterVersion);
      }
    },
  );

const projectRequestPath = '/apis/project.openshift.io/v1/projectrequests';
const detectCanCreateProject = (dispatch) =>
  fetchURL(projectRequestPath).then(
    (res) => dispatch(setFlag(FLAGS.CAN_CREATE_PROJECT, res.status === 'Success')),
    (err) => {
      const status = err?.response?.status;
      if (status === 403) {
        dispatch(setFlag(FLAGS.CAN_CREATE_PROJECT, false));
        dispatch(setCreateProjectMessage(_.get(err, 'json.details.causes[0].message')));
      } else if (!_.includes([400, 404, 500], status)) {
        retryFlagDetection(dispatch, detectCanCreateProject);
      }
    },
  );

const detectUser = (dispatch) =>
  fetchURL('/apis/user.openshift.io/v1/users/~').then(
    (user) => {
      dispatch(setUser(user));
    },
    (err) => {
      if (!_.includes([401, 403, 404, 500], err?.response?.status)) {
        setTimeout(() => detectUser(dispatch), 15000);
      }
    },
  );

const ssarCheckActions = ssarChecks.map(({ flag, resourceAttributes, after }) => {
  const fn = (dispatch: Dispatch) =>
    client
      .query<SSARQueryType, SSARQueryVariables>({
        query: SSARQuery,
        variables: resourceAttributes,
      })
      .then(
        (res) => {
          const allowed: boolean = res.data.selfSubjectAccessReview.status.allowed;
          dispatch(setFlag(flag, allowed));
          if (after) {
            after(dispatch, allowed);
          }
        },
        (err) => handleError({ response: err.graphQLErrors[0]?.extensions }, flag, dispatch, fn),
      );
  return fn;
});

export const detectFeatures = () => (dispatch: Dispatch) =>
  [
    detectOpenShift,
    detectCanCreateProject,
    detectClusterVersion,
    detectUser,
    ...ssarCheckActions,
    ...pluginStore
      .getAllExtensions()
      .filter(isCustomFeatureFlag)
      .map((ff) => ff.properties.detect),
  ].forEach((detect) => detect(dispatch));

const featureFlagController: SetFeatureFlag = (flag, enabled) => {
  store.dispatch(setFlag(flag, enabled));
};

const processedExtensions: DynamicFeatureFlag[] = [];

subscribeToExtensions<DynamicFeatureFlag>(
  extensionDiffListener((added) => {
    added.forEach((e) => {
      if (!processedExtensions.includes(e)) {
        processedExtensions.push(e);
        executeReferencedFunction(e.properties.handler, featureFlagController);
      }
    });
  }),
  isDynamicFeatureFlag,
);
