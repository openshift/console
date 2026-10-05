/* eslint-disable */
import { GetSegmentAnalytics } from '../extensions/console-types';

/**
 * Allows integration with Console specific Segment Analytics instance.
 *
 * This API is meant to be used by Red Hat plugins only.
 *
 * Console application takes care of loading the analytics.min.js script.
 *
 * `analyticsEnabled` is `false` when telemetry is disabled cluster-wide, when
 * this browser tab was not selected for the 20% Segment sample, or both. The
 * sample decision is stored in sessionStorage for the tab to survive reloads
 * and SSO redirects.
 *
 * @example
 * ```ts
 * const { analytics, analyticsEnabled } = getSegmentAnalytics();
 *
 * if (analyticsEnabled) {
 *   // invoke methods on analytics object as needed
 * }
 * ```
 *
 * @see https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/
 */
export const getSegmentAnalytics: GetSegmentAnalytics =
  require('@console/dynamic-plugin-sdk/src/api/segment-analytics').getSegmentAnalytics;
