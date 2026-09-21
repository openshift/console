/* eslint-disable */
import { GetSegmentAnalytics } from '../extensions/console-types';

/**
 * Allows integration with Console specific Segment Analytics instance.
 *
 * This API is meant to be used by Red Hat plugins only.
 *
 * The client is initialized at module load time. `analytics.load()` is
 * asynchronous, but `@segment/analytics-next` buffers calls made before load
 * completes. Check `analyticsEnabled` before sending events which is `false`
 * when telemetry is disabled, the session is not sampled, or initialization
 * failed.
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
