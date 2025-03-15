import * as React from 'react';
import { LaunchOverlay, OverlayContext } from './OverlayProvider';

type UseOverlayLauncher = () => LaunchOverlay;

/**
 * A hook to launch Overlays.
 * @example
 *```tsx
 * const AppPage: React.FC = () => {
 *  const launchOverlay = useOverlay();
 *  const onClick = () => launchOverlay(OverlayComponent);
 *  return (
 *    <Button onClick={onClick}>Launch an Overlay</Button>
 *  )
 * }
 * ```
 */
export const useOverlay: UseOverlayLauncher = () => {
  const { launchOverlay } = React.useContext(OverlayContext);
  return launchOverlay;
};
