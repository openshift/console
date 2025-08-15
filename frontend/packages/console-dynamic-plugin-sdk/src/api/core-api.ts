/* eslint-disable */
import { GetSegmentAnalytics, UseActivePerspective } from '../extensions/console-types';

/**
 * This function provides access to Segment Analytics API.
 *
 * Console application takes care of loading the analytics.min.js script.
 * Console plugins should _not_ attempt to initialize Segment Analytics on their own.
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
export const getSegmentAnalytics: GetSegmentAnalytics = require('@console/dynamic-plugin-sdk/src/api/segment-analytics')
  .getSegmentAnalytics;

/**
 * Hook that provides the currently active perspective and a callback for setting the active perspective
 * @returns A tuple containing the current active perspective and setter callback.
 * @example
 * ```tsx
 * const Component: React.FC = (props) => {
 *    const [activePerspective, setActivePerspective] = useActivePerspective();
 *    return <select
 *      value={activePerspective}
 *      onChange={(e) => setActivePerspective(e.target.value)}
 *    >
 *      {
 *        // ...perspective options
 *      }
 *    </select>
 * }
 * ```
 */
export const useActivePerspective: UseActivePerspective = require('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective')
  .default;

export * from '../perspective/perspective-context';

// Dynamic plugin SDK core APIs
export * from './dynamic-core-api';
