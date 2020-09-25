import * as _ from 'lodash-es';
import * as semver from 'semver';

import { ClusterVersionModel } from '../../models';
import { referenceForModel } from './k8s';
import {
  ClusterVersionKind,
  ClusterUpdate,
  ClusterVersionConditionType,
  K8sResourceConditionStatus,
  ClusterVersionCondition,
  UpdateHistory,
} from '.';

export enum ClusterUpdateStatus {
  UpToDate = 'Up to Date',
  UpdatesAvailable = 'Updates Available',
  Updating = 'Updating',
  Failing = 'Failing',
  ErrorRetrieving = 'Error Retrieving',
  Invalid = 'Invalid Cluster Version',
}

export const clusterVersionReference = referenceForModel(ClusterVersionModel);

export const getAvailableClusterUpdates = (cv: ClusterVersionKind): ClusterUpdate[] => {
  return _.get(cv, 'status.availableUpdates', []);
};

export const getAvailableClusterChannels = () => ({
  'stable-4.5': 'stable-4.5',
  'fast-4.5': 'fast-4.5',
  'candidate-4.5': 'candidate-4.5',
});

export const getDesiredClusterVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.desired.version');
};

export const getClusterVersionChannel = (cv: ClusterVersionKind): string =>
  cv && cv.spec ? cv.spec.channel : undefined;

export const getLastCompletedUpdate = (cv: ClusterVersionKind): string => {
  const history: UpdateHistory[] = _.get(cv, 'status.history', []);
  const lastCompleted: UpdateHistory = history.find((update) => update.state === 'Completed');
  return lastCompleted && lastCompleted.version;
};

export const getClusterVersionCondition = (
  cv: ClusterVersionKind,
  type: ClusterVersionConditionType,
  status: K8sResourceConditionStatus = undefined,
): ClusterVersionCondition => {
  const conditions: ClusterVersionCondition[] = _.get(cv, 'status.conditions');
  if (status) {
    return _.find(conditions, { type, status });
  }
  return _.find(conditions, { type });
};

export const isProgressing = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(
    getClusterVersionCondition(
      cv,
      ClusterVersionConditionType.Progressing,
      K8sResourceConditionStatus.True,
    ),
  );
};

export const invalid = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(
    getClusterVersionCondition(
      cv,
      ClusterVersionConditionType.Invalid,
      K8sResourceConditionStatus.True,
    ),
  );
};

export const failedToRetrieveUpdates = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(
    getClusterVersionCondition(
      cv,
      ClusterVersionConditionType.RetrievedUpdates,
      K8sResourceConditionStatus.False,
    ),
  );
};

export const updateFailing = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(
    getClusterVersionCondition(
      cv,
      ClusterVersionConditionType.Failing,
      K8sResourceConditionStatus.True,
    ),
  );
};

export const hasAvailableUpdates = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(getAvailableClusterUpdates(cv));
};

export const getClusterUpdateStatus = (cv: ClusterVersionKind): ClusterUpdateStatus => {
  if (invalid(cv)) {
    return ClusterUpdateStatus.Invalid;
  }

  if (updateFailing(cv)) {
    return ClusterUpdateStatus.Failing;
  }

  if (isProgressing(cv)) {
    return ClusterUpdateStatus.Updating;
  }

  if (failedToRetrieveUpdates(cv)) {
    return ClusterUpdateStatus.ErrorRetrieving;
  }

  return hasAvailableUpdates(cv)
    ? ClusterUpdateStatus.UpdatesAvailable
    : ClusterUpdateStatus.UpToDate;
};

export const getK8sGitVersion = (k8sVersionResponse): string =>
  _.get(k8sVersionResponse, 'gitVersion');

export const getOpenShiftVersion = (cv: ClusterVersionKind): string => {
  const lastUpdate: UpdateHistory = _.get(cv, 'status.history[0]');
  if (!lastUpdate) {
    return null;
  }
  return lastUpdate.state === 'Partial' ? `Updating to ${lastUpdate.version}` : lastUpdate.version;
};

const getCurrentVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.history[0].version') || _.get(cv, 'spec.desiredUpdate.version');
};

export const getReportBugLink = (cv: ClusterVersionKind): { label: string; href: string } => {
  const version: string = getCurrentVersion(cv);
  const parsed = semver.parse(version);
  if (!parsed) {
    return null;
  }

  // Show a Bugzilla link for prerelease versions and a support case link for supported versions.
  const { major, minor, prerelease } = parsed;
  const bugzillaVersion = major === 4 && minor <= 3 ? `${major}.${minor}.0` : `${major}.${minor}`;
  const environment = encodeURIComponent(`Version: ${version}
Cluster ID: ${cv.spec.clusterID}
Browser: ${window.navigator.userAgent}
`);
  return _.isEmpty(prerelease)
    ? {
        label: 'Open Support Case with Red Hat',
        href: `https://access.redhat.com/support/cases/#/case/new?product=OpenShift%20Container%20Platform&version=${major}.${minor}&clusterId=${cv.spec.clusterID}`,
      }
    : {
        label: 'Report Bug to Red Hat',
        href: `https://bugzilla.redhat.com/enter_bug.cgi?product=OpenShift%20Container%20Platform&version=${bugzillaVersion}&cf_environment=${environment}`,
      };
};

// example link: https://access.redhat.com/downloads/content/290/ver=4.1/rhel---7/4.1.13/x86_64/product-errata
export const getErrataLink = (cv: ClusterVersionKind): string => {
  const version: string = getCurrentVersion(cv);
  const parsed = semver.parse(version);
  if (!parsed) {
    return null;
  }

  const { major, minor, patch, prerelease } = parsed;
  if (major !== 4 || !_.isEmpty(prerelease)) {
    return null;
  }

  // TODO: Determine architecture instead of assuming x86_64.
  return `https://access.redhat.com/downloads/content/290/ver=${major}.${minor}/rhel---7/${major}.${minor}.${patch}/x86_64/product-errata`;
};

export const getClusterName = (): string => window.SERVER_FLAGS.kubeAPIServerURL || null;

export const getClusterID = (cv: ClusterVersionKind): string => _.get(cv, 'spec.clusterID');

export const getOCMLink = (clusterID: string): string =>
  `https://cloud.redhat.com/openshift/details/${clusterID}`;
