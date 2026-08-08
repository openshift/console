import * as semver from 'semver';
import type { ClusterVersionKind } from '@console/internal/module/k8s';

const VERSION_FALLBACK = 'unknown';
const SEMVER_CHARS = /^[0-9a-zA-Z.+-]+$/;
const ALLOWED_PRERELEASE_WORDS = new Set([
  'rc',
  'alpha',
  'beta',
  'nightly',
  'ci',
  'ec',
  'okd',
  'scos',
  'quay',
]);

/**
 * Validate a version string with strict semver parsing, preserving prerelease
 * identifiers. Rejects structural injection characters via regex, non-semver
 * strings via semver.parse, and unrecognized prerelease identifiers via allowlist.
 */
export const validateVersionString = (version: string | undefined | null): string => {
  if (!version || !SEMVER_CHARS.test(version)) {
    return VERSION_FALLBACK;
  }
  const parsed = semver.parse(version);
  if (!parsed) {
    return VERSION_FALLBACK;
  }
  if (parsed.prerelease.length > 0) {
    const words = parsed.prerelease.flatMap((id) => String(id).toLowerCase().split('-'));
    if (words.some((w) => !/^\d+$/.test(w) && !ALLOWED_PRERELEASE_WORDS.has(w))) {
      return VERSION_FALLBACK;
    }
  }
  return parsed.version;
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
