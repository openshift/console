import * as React from 'react';
import { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import { usePerspectives, useTelemetry } from '@console/shared/src';
import { usePreferredPerspective } from '../user-preferences';
import { useLastPerspective } from './useLastPerspective';

export const useValuesForPerspectiveContext = (): [
  PerspectiveType,
  (newPerspective: string) => void,
  boolean,
] => {
  const fireTelemetryEvent = useTelemetry();
  const perspectiveExtensions = usePerspectives();
  const [lastPerspective, setLastPerspective, lastPerspectiveLoaded] = useLastPerspective();
  const [preferredPerspective, , preferredPerspectiveLoaded] = usePreferredPerspective();
  const [activePerspective, setActivePerspective] = React.useState('');
  const loaded = lastPerspectiveLoaded && preferredPerspectiveLoaded;
  const latestPerspective = loaded && (preferredPerspective || lastPerspective);
  const perspective = activePerspective || latestPerspective;
  const isValidPerspective =
    loaded && perspectiveExtensions.some((p) => p.properties.id === perspective);

  const setPerspective = (newPerspective: string) => {
    setLastPerspective(newPerspective);
    setActivePerspective(newPerspective);
    // Navigate to root and let the default page determine where to go to next
    history.push('/');
    fireTelemetryEvent('Perspective Changed', { perspective: newPerspective });
  };

  return [isValidPerspective ? perspective : undefined, setPerspective, loaded];
};
