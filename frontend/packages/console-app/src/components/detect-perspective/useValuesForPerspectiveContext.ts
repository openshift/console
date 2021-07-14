import * as React from 'react';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { useUserSettingsCompatibility } from '@console/shared';
import { usePreferredPerspective } from '../user-preferences';
import { PerspectiveType } from './perspective-context';

const LAST_PERSPECTIVE_LOCAL_STORAGE_KEY = `bridge/last-perspective`;

const LAST_PERSPECTIVE_USER_SETTINGS_KEY = 'console.lastPerspective';

export const useValuesForPerspectiveContext = (): [
  PerspectiveType,
  React.Dispatch<React.SetStateAction<PerspectiveType>>,
  boolean,
] => {
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const [lastPerspective, setLastPerspective, lastPerspectiveLoaded] = useUserSettingsCompatibility<
    PerspectiveType
  >(LAST_PERSPECTIVE_USER_SETTINGS_KEY, LAST_PERSPECTIVE_LOCAL_STORAGE_KEY, '');
  const [preferredPerspective, preferredPerspectiveLoaded] = usePreferredPerspective();

  const loaded = lastPerspectiveLoaded && preferredPerspectiveLoaded;

  const perspective =
    loaded && preferredPerspective && preferredPerspective !== 'latest'
      ? preferredPerspective
      : lastPerspective;

  const isValidPerspective =
    loaded && perspectiveExtensions.some((p) => p.properties.id === perspective);
  return [isValidPerspective ? perspective : undefined, setLastPerspective, loaded];
};
