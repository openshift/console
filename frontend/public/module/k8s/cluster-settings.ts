import * as _ from 'lodash-es';
import * as semver from 'semver';
import i18next from 'i18next';

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

export const getNewerMinorVersionUpdate = (currentVersion, availableUpdates) => {
  const currentVersionParsed = semver.parse(currentVersion);
  return availableUpdates?.find(
    // find the next minor version update, which there should never be more than one
    (update) => {
      const updateParsed = semver.parse(update.version);
      return semver.gt(
        semver.coerce(`${updateParsed.major}.${updateParsed.minor}`),
        semver.coerce(`${currentVersionParsed.major}.${currentVersionParsed.minor}`),
      );
    },
  );
};

export const isMinorVersionNewer = (currentVersion, otherVersion) => {
  const currentVersionParsed = semver.parse(currentVersion);
  const otherVersionParsed = semver.parse(otherVersion);
  return semver.gt(
    semver.coerce(`${otherVersionParsed.major}.${otherVersionParsed.minor}`),
    semver.coerce(`${currentVersionParsed.major}.${currentVersionParsed.minor}`),
  );
};

export const getAvailableClusterChannels = (cv) => {
  return cv?.status?.desired?.channels || [];
};

export const getDesiredClusterVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.desired.version');
};

export const getClusterVersionChannel = (cv: ClusterVersionKind): string => cv?.spec?.channel;

export const splitClusterVersionChannel = (channel: string) => {
  const parsed = /^(.+)-(\d\.\d+)$/.exec(channel);
  return parsed ? { prefix: parsed[1], version: parsed[2] } : null;
};

export const getSimilarClusterVersionChannels = (cv, currentPrefix) => {
  return getAvailableClusterChannels(cv).filter((channel: string) => {
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

export const getCurrentVersion = (cv: ClusterVersionKind): string => {
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
        label: i18next.t('public~Open support case with Red Hat'),
        href: `https://access.redhat.com/support/cases/#/case/new?product=OpenShift%20Container%20Platform&version=${major}.${minor}&clusterId=${cv.spec.clusterID}`,
      }
    : {
        label: i18next.t('public~Report bug to Red Hat'),
        href: `https://bugzilla.redhat.com/enter_bug.cgi?product=OpenShift%20Container%20Platform&version=${bugzillaVersion}&cf_environment=${environment}`,
      };
};

export const showReleaseNotes = (): boolean => {
  return window.SERVER_FLAGS.branding === 'ocp';
};

// example link: https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/release_notes/ocp-4-9-release-notes#ocp-4-9-4
export const getReleaseNotesLink = (version: string): string => {
  if (!showReleaseNotes()) {
    return null;
  }

  const parsed = semver.parse(version);
  if (!parsed) {
    return null;
  }

  const { major, minor, patch, prerelease } = parsed;
  if (major !== 4 || !_.isEmpty(prerelease)) {
    return null;
  }

  return `https://access.redhat.com/documentation/en-us/openshift_container_platform/${major}.${minor}/html/release_notes/ocp-${major}-${minor}-release-notes#ocp-${major}-${minor}-${patch}`;
};

export const getClusterName = (): string => window.SERVER_FLAGS.kubeAPIServerURL || null;

export const getClusterID = (cv: ClusterVersionKind): string => _.get(cv, 'spec.clusterID');

export const getOCMLink = (clusterID: string): string =>
  `https://console.redhat.com/openshift/details/${clusterID}`;

export const getConditionUpgradeableFalse = (resource) =>
  resource.status?.conditions?.find(
    (c) => c.type === 'Upgradeable' && c.status === K8sResourceConditionStatus.False,
  );

export const getNotUpgradeableResources = (resources) =>
  resources.filter((resource) => getConditionUpgradeableFalse(resource));
