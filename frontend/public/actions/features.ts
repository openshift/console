import { Dispatch } from 'redux';
import * as _ from 'lodash';

import { FLAGS } from '@console/shared/src/constants/common';
import { UserInfo } from '@console/internal/module/k8s';
import { setUser } from '@console/dynamic-plugin-sdk/src/app/core/actions/core';
import { ClusterVersionKind } from '../module/k8s/types';
import { setClusterID, setCreateProjectMessage } from './common';
import client, { fetchURL } from '../graphql/client';
import { SSARQuery, SSRQuery } from './features.gql';
import {
  SSARQueryType,
  SSARQueryVariables,
  SSRQueryType,
} from '../../@types/console/generated/graphql-schema';

import { handleError, retryFlagDetection, setFlag, ssarChecks } from './flags';

export const defaults = _.mapValues(FLAGS, (flag) =>
  flag === FLAGS.AUTH_ENABLED ? !window.SERVER_FLAGS.authDisabled : undefined,
);

// This config API contains the OpenShift Project, and other mandatory resources
const openshiftPath = '/apis/config.openshift.io/v1';
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

const detectUser = (dispatch: Dispatch) =>
  client
    .query<SSRQueryType>({
      query: SSRQuery,
    })
    .then(
      (res) => {
        const userInfo = res.data.selfSubjectReview.status.userInfo;
        const newUserInfo: UserInfo = {};
        if (userInfo.extra) {
          try {
            newUserInfo.extra = JSON.parse(userInfo.extra);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error parsing UserInfo JSON:', error);
          }
        }
        newUserInfo.groups = userInfo.groups;
        newUserInfo.uid = userInfo.uid;
        newUserInfo.username = userInfo.username;
        dispatch(setUser(newUserInfo));
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Error retrieving SelfSubjectReview: ', err);
        if (!_.includes([400, 404, 500], err?.response?.status)) {
          retryFlagDetection(dispatch, detectUser);
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

export const detectFeatures = () => (dispatch: Dispatch) => {
  [
    detectOpenShift,
    detectCanCreateProject,
    detectClusterVersion,
    detectUser,
    ...ssarCheckActions,
  ].forEach((detect) => detect(dispatch));
};
