import * as React from 'react';
import { useUserSettingsCompatibility } from '@console/dynamic-plugin-sdk';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { PerspectiveType } from './perspective-context';

const LAST_PERSPECTIVE_LOCAL_STORAGE_KEY = `bridge/last-perspective`;

const LAST_PERSPECTIVE_USER_SETTINGS_KEY = 'console.lastPerspective';

export const useValuesForPerspectiveContext = (): [
  PerspectiveType,
  React.Dispatch<React.SetStateAction<PerspectiveType>>,
  boolean,
] => {
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const [perspective, setPerspective, loaded] = useUserSettingsCompatibility<PerspectiveType>(
    LAST_PERSPECTIVE_USER_SETTINGS_KEY,
    LAST_PERSPECTIVE_LOCAL_STORAGE_KEY,
    '',
  );
  const isValidPerspective =
    loaded && perspectiveExtensions.some((p) => p.properties.id === perspective);
  return [isValidPerspective ? perspective : undefined, setPerspective, loaded];
};
