import * as semver from 'semver';
import type { ClusterVersionKind } from '@console/internal/module/k8s';
import {
  CLUSTER_VERSION_CONDITION_AVAILABLE,
  CLUSTER_VERSION_CONDITION_FAILING,
  CLUSTER_VERSION_CONDITION_PROGRESSING,
  CLUSTER_VERSION_CONDITION_RETRIEVED_UPDATES,
  CLUSTER_VERSION_CONDITION_RELEASE_ACCEPTED,
  CLUSTER_VERSION_CONDITION_UPGRADEABLE,
  CLUSTER_VERSION_CONDITION_IMPLICITLY_ENABLED_CAPABILITIES,
  CONDITION_STATUS_TRUE,
  CONDITION_STATUS_FALSE,
  CONDITION_STATUS_UNKNOWN,
} from './constants';

const VERSION_FALLBACK = 'unknown';

/**
 * Coerce a version string to `major.minor.patch` using semver.coerce, which always
 * strips prerelease identifiers and build metadata. The result is digits and dots only,
 * so it carries no prompt-injection surface regardless of the input content.
 */
export const validateVersionString = (version: string | undefined | null): string => {
  if (!version) {
    return VERSION_FALLBACK;
  }
  const parsed = semver.coerce(version);
  return parsed ? parsed.version : VERSION_FALLBACK;
};

/**
 * Extract current version from cluster version history
 */
export const getCurrentVersion = (cv: ClusterVersionKind): string => {
  const raw = cv.status?.history?.find((h) => h.state === 'Completed')?.version;
  return validateVersionString(raw);
};

/**
 * Extract desired version from cluster version spec or status
 */
export const getDesiredVersion = (cv: ClusterVersionKind): string => {
  const raw = cv.spec?.desiredUpdate?.version || cv.status?.desired?.version;
  return validateVersionString(raw);
};

/**
 * Literal status of a ClusterVersion condition. `absent` distinguishes a condition
 * that is not present at all (e.g. no Upgradeable condition, which means upgrades are
 * allowed) from one explicitly set to `False`.
 */
export type VerifiedConditionStatus = 'True' | 'False' | 'Unknown' | 'absent';

/**
 * The ClusterVersion condition statuses the console reads directly and injects into the
 * pre-check prompts as authoritative facts. These are enum values only (no untrusted
 * message/reason text), so they carry no prompt-injection surface.
 */
export interface VerifiedClusterVersionConditions {
  Failing: VerifiedConditionStatus;
  Upgradeable: VerifiedConditionStatus;
  Available: VerifiedConditionStatus;
  Progressing: VerifiedConditionStatus;
  RetrievedUpdates: VerifiedConditionStatus;
  ReleaseAccepted: VerifiedConditionStatus;
  ImplicitlyEnabledCapabilities: VerifiedConditionStatus;
}

/**
 * Read the literal statuses of the ClusterVersion conditions the pre-check reasons about.
 *
 * The OLS model repeatedly misreports these conditions (e.g. Failing=True on a healthy
 * cluster) because it copies the illustrative {type, status} pairs from the prompt's
 * condition legend as if they were real data. Since the console already holds the live
 * ClusterVersion, we read the statuses here and inject them into the prompt as ground
 * truth. Reads the raw conditions (rather than the boolean predicates) so the True /
 * False / Unknown / absent distinction is preserved.
 *
 * @param cv - ClusterVersion resource
 * @returns literal status per condition, `absent` when the condition is not present
 * @public
 */
export const getVerifiedClusterVersionConditions = (
  cv: ClusterVersionKind,
): VerifiedClusterVersionConditions => {
  const conditions = cv?.status?.conditions || [];
  const statusOf = (type: string): VerifiedConditionStatus => {
    const condition = conditions.find((c) => c.type === type);
    if (!condition) {
      return 'absent';
    }
    const { status } = condition;
    return status === CONDITION_STATUS_TRUE ||
      status === CONDITION_STATUS_FALSE ||
      status === CONDITION_STATUS_UNKNOWN
      ? status
      : 'absent';
  };
  return {
    Failing: statusOf(CLUSTER_VERSION_CONDITION_FAILING),
    Upgradeable: statusOf(CLUSTER_VERSION_CONDITION_UPGRADEABLE),
    Available: statusOf(CLUSTER_VERSION_CONDITION_AVAILABLE),
    Progressing: statusOf(CLUSTER_VERSION_CONDITION_PROGRESSING),
    RetrievedUpdates: statusOf(CLUSTER_VERSION_CONDITION_RETRIEVED_UPDATES),
    ReleaseAccepted: statusOf(CLUSTER_VERSION_CONDITION_RELEASE_ACCEPTED),
    ImplicitlyEnabledCapabilities: statusOf(
      CLUSTER_VERSION_CONDITION_IMPLICITLY_ENABLED_CAPABILITIES,
    ),
  };
};
