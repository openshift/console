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
  UpdatingAndFailing = 'Updating and Failing',
  ErrorRetrieving = 'Error Retrieving',
  Invalid = 'Invalid Cluster Version',
}

export const clusterVersionReference = referenceForModel(ClusterVersionModel);

export const getAvailableClusterUpdates = (cv: ClusterVersionKind): ClusterUpdate[] => {
  return _.get(cv, 'status.availableUpdates', []);
};

export const getSortedUpdates = (cv: ClusterVersionKind): ClusterUpdate[] => {
  const available = getAvailableClusterUpdates(cv) || [];
  try {
    return available.sort(({ version: left }, { version: right }) => semver.rcompare(left, right));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('error sorting cluster updates', e);
    return available;
  }
};

export const getAvailableClusterChannels = () => ({
  'stable-4.6': 'stable-4.6',
  'fast-4.6': 'fast-4.6',
  'candidate-4.6': 'candidate-4.6',
});

export const getDesiredClusterVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.desired.version');
};

export const getClusterVersionChannel = (cv: ClusterVersionKind): string => cv?.spec?.channel;

export const splitClusterVersionChannel = (channel: string) => {
  const parsed = /^(.+)-(\d\.\d+)$/.exec(channel);
  return parsed ? { prefix: parsed[1], version: parsed[2] } : null;
};

export const getSimilarClusterVersionChannels = (currentPrefix) => {
  return _.keys(getAvailableClusterChannels()).filter((channel: string) => {
    return currentPrefix && splitClusterVersionChannel(channel)?.prefix === currentPrefix;
  });
};

export const getNewerClusterVersionChannel = (similarChannels, currentChannel) => {
  return similarChannels.find(
    // find the next minor version, which there should never be more than one
    (channel) => semver.gt(semver.coerce(channel).version, semver.coerce(currentChannel).version),
  );
};

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

  if (isProgressing(cv) && updateFailing(cv)) {
    return ClusterUpdateStatus.UpdatingAndFailing;
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

type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
};

export const getCurrentVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.history[0].version') || _.get(cv, 'spec.desiredUpdate.version');
};

export const getReportBugLink = (cv: ClusterVersionKind): { label: string; href: string } => {
  const version: string = getCurrentVersion(cv);
  const parsed: ParsedVersion = semver.parse(version);
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

export const showReleaseNotes = (): boolean => {
  return window.SERVER_FLAGS.branding === 'ocp';
};

// example link: https://docs.openshift.com/container-platform/4.2/release_notes/ocp-4-2-release-notes.html#ocp-4-2-4
export const getReleaseNotesLink = (version: string): string => {
  if (!showReleaseNotes()) {
    return null;
  }

  const parsed: ParsedVersion = semver.parse(version);
  if (!parsed) {
    return null;
  }

  const { major, minor, patch, prerelease } = parsed;
  if (major !== 4 || !_.isEmpty(prerelease)) {
    return null;
  }

  return `https://docs.openshift.com/container-platform/${major}.${minor}/release_notes/ocp-${major}-${minor}-release-notes.html#ocp-${major}-${minor}-${patch}`;
};

export const getClusterName = (): string => window.SERVER_FLAGS.kubeAPIServerURL || null;

export const getClusterID = (cv: ClusterVersionKind): string => _.get(cv, 'spec.clusterID');

export const getOCMLink = (clusterID: string): string =>
  `https://cloud.redhat.com/openshift/details/${clusterID}`;
