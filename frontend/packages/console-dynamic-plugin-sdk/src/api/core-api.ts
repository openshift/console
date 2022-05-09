/* eslint-disable */
import { UseActivePerspective } from '../extensions/console-types';

/**
 * Hook that provides the currently active perspective and a callback for setting the active perspective
 * @returns Tuple `[activePerspective, setActivePerspective]` where:
 *  `activePerspective` is the currently active perspective as defined in redux state
 *  `setActivePerspective` is a callback that accepts a string argument and sets the appropriate active perspective redux state
 * @example
 * ```tsx
 * const Component: React.FC = (props) => {
 *    const [activePerspective, setActivePerspective] = useActivePerspective();
 *    return <select
 *      value={activePerspective}
 *      onChange={(e) => setActivePerspective(e.target.value)}
 *    >
 *      {
 *        // ...perspective opttions
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
