import { Dispatch } from 'redux';
import * as _ from 'lodash';

import { FLAGS } from '@console/shared/src/constants/common';
import { UserInfo } from '@console/internal/module/k8s';
import { setUser } from '@console/dynamic-plugin-sdk/src/app/core/actions/core';
import { setClusterID, setCreateProjectMessage } from './common';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { SelfSubjectAccessReviewModel, SelfSubjectReviewModel } from '../models';
import { resourceURL } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-utils';
import { k8sBasePath } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s';

import { handleError, retryFlagDetection, setFlag, ssarChecks } from './flags';

// This config API contains the OpenShift Project, and other mandatory resources
const openshiftPath = `${k8sBasePath}/apis/config.openshift.io/v1`;
const detectOpenShift = (dispatch) =>
  coFetchJSON(openshiftPath).then(
    (res) => dispatch(setFlag(FLAGS.OPENSHIFT, _.size(res.resources) > 0)),
    (err) =>
      err?.response?.status === 404
        ? dispatch(setFlag(FLAGS.OPENSHIFT, false))
        : handleError(err, FLAGS.OPENSHIFT, dispatch, detectOpenShift),
  );

const clusterVersionPath = `${k8sBasePath}/apis/config.openshift.io/v1/clusterversions/version`;
const detectClusterVersion = (dispatch) =>
  coFetchJSON(clusterVersionPath).then(
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

const projectRequestPath = `${k8sBasePath}/apis/project.openshift.io/v1/projectrequests`;
const detectCanCreateProject = (dispatch) =>
  coFetchJSON(projectRequestPath).then(
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

const ssrURL = resourceURL(SelfSubjectReviewModel, {});
const detectUser = (dispatch: Dispatch) =>
  coFetchJSON
    .post(ssrURL, {
      apiVersion: `${SelfSubjectReviewModel.apiGroup}/${SelfSubjectReviewModel.apiVersion}`,
      kind: SelfSubjectReviewModel.kind,
    })
    .then(
      (res) => {
        const userInfo = res.status.userInfo;
        const newUserInfo: UserInfo = {};
        if (userInfo.extra) {
          try {
            newUserInfo.extra =
              typeof userInfo.extra === 'string' ? JSON.parse(userInfo.extra) : userInfo.extra;
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

const ssarURL = resourceURL(SelfSubjectAccessReviewModel, {});
const ssarCheckActions = ssarChecks.map(({ flag, resourceAttributes, after }) => {
  const fn = (dispatch: Dispatch) =>
    coFetchJSON
      .post(ssarURL, {
        apiVersion: `${SelfSubjectAccessReviewModel.apiGroup}/${SelfSubjectAccessReviewModel.apiVersion}`,
        kind: SelfSubjectAccessReviewModel.kind,
        spec: { resourceAttributes },
      })
      .then(
        (res) => {
          const allowed: boolean = res.status.allowed;
          dispatch(setFlag(flag, allowed));
          if (after) {
            after(dispatch, allowed);
          }
        },
        (err) => handleError(err, flag, dispatch, fn),
      );
  return fn;
});

export const detectFeatures = () => (dispatch: Dispatch) =>
  Promise.all(
    [
      detectOpenShift,
      detectCanCreateProject,
      detectClusterVersion,
      detectUser,
      ...ssarCheckActions,
    ].map((detect) => detect(dispatch)),
  );
