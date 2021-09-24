import * as React from 'react';
import { isPerspective, Perspective, PerspectiveType } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { usePreferredPerspective } from '../user-preferences';
import { useLastPerspective } from './useLastPerspective';

export const useValuesForPerspectiveContext = (): [
  PerspectiveType,
  (newPerspective: string) => void,
  boolean,
] => {
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const [lastPerspective, setLastPerspective, lastPerspectiveLoaded] = useLastPerspective();
  const [preferredPerspective, , preferredPerspectiveLoaded] = usePreferredPerspective();
  const [activePerspective, setActivePerspective] = React.useState<string>('');

  const loaded = lastPerspectiveLoaded && preferredPerspectiveLoaded;

  const latestPerspective = loaded && (preferredPerspective || lastPerspective);

  const perspective = activePerspective || latestPerspective;

  const isValidPerspective =
    loaded && perspectiveExtensions.some((p) => p.properties.id === perspective);

  const setPerspective = (newPerspective: string) => {
    setLastPerspective(newPerspective);
    setActivePerspective(newPerspective);
  };

  return [isValidPerspective ? perspective : undefined, setPerspective, loaded];
};
