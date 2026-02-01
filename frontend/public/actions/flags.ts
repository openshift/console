import * as _ from 'lodash';
import type { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { ModelFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { receivedResources } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import { K8sModel } from '@console/internal/module/k8s';
import { FLAGS } from '@console/shared/src/constants/common';
import { ActionType as Action, action } from 'typesafe-actions';
import { fetchURL } from '../graphql/client';
import { GroupModel, UserModel, VolumeSnapshotContentModel } from '../models';

export enum ActionType {
  SetFlag = 'setFlag',
  ClearSSARFlags = 'clearSSARFlags',
  UpdateModelFlags = 'updateModelFlags',
}

const projectListPath = '/apis/project.openshift.io/v1/projects?limit=1';

export const retryFlagDetection = (dispatch, cb) => {
  setTimeout(() => cb(dispatch), 15000);
};

export const setFlag = (flag: FLAGS | string, value: boolean) =>
  action(ActionType.SetFlag, { flag, value });

export const handleError = (res, flag, dispatch, cb) => {
  const status = res?.response?.status;
  if (_.includes([403, 502], status)) {
    dispatch(setFlag(flag, undefined));
  }
  if (!_.includes([401, 403, 500], status)) {
    retryFlagDetection(dispatch, cb);
  }
};

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
export const ssarChecks = [
  {
    flag: FLAGS.CAN_CREATE_NS,
    resourceAttributes: { resource: 'namespaces', verb: 'get' },
  },
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

export const updateModelFlags = (
  added: ResolvedExtension<ModelFeatureFlag>[],
  removed: ResolvedExtension<ModelFeatureFlag>[],
  models: K8sModel[],
) => action(ActionType.UpdateModelFlags, { added, removed, models });

const featureActions = { setFlag, updateModelFlags };
const clearFlags = { clearSSARFlags };

export type FeatureAction = Action<
  typeof featureActions | typeof receivedResources | typeof clearFlags
>;
