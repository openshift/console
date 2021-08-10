import * as React from 'react';
import { PerspectiveContext, PerspectiveType } from '@console/dynamic-plugin-sdk';
import useMaintainDefaultPerspective from './useMaintainDefaultPerspective';

type DetectPerspectiveProps = {
  children: React.ReactNode;
};

/**
 * Slim-down version to avoid user-preferences
 * @deprecated -- we need to use the one in console-app -- once we figure out where user-preferences goes
 * TODO: Delete this and replace
 */
const DetectPerspective: React.FC<DetectPerspectiveProps> = ({ children }) => {
  const [activePerspective, setActivePerspective] = React.useState<PerspectiveType>(null);
  useMaintainDefaultPerspective(setActivePerspective);

  return (
    <PerspectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
      {children}
    </PerspectiveContext.Provider>
  );
};

export default DetectPerspective;
