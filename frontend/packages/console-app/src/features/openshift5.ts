import { coerce, gtr } from 'semver';
import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { FLAG_OPENSHIFT_5 } from '../consts';

const version = window.SERVER_FLAGS?.releaseVersion || '5.0.0-unknown';

export const IS_OPENSHIFT_5 = gtr(coerce(version), '4.x', {
  includePrerelease: true,
  loose: true,
});

/**
 * Matches OpenShift 5 or later (or matches if the version is unknown, i.e., development node)
 *
 * TODO: This flag will always be true when we no longer branch 4.x from main
 */
export const handler: FeatureFlagHandler = (callback) => {
  callback(FLAG_OPENSHIFT_5, IS_OPENSHIFT_5);
};
