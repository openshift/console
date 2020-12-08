import * as React from 'react';
import PerspectiveDetector from './PerspectiveDetector';
import { PerpsectiveContext } from './perspective-context';
import { useValuesForPerspectiveContext } from './useValuesForPerspectiveContext';

type DetectPerspectiveProps = {
  children: React.ReactNode;
};

const DetectPerspective: React.FC<DetectPerspectiveProps> = ({ children }) => {
  const [activePerspective, setActivePerspective, loaded] = useValuesForPerspectiveContext();
  return loaded ? (
    activePerspective ? (
      <PerpsectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
        {children}
      </PerpsectiveContext.Provider>
    ) : (
      <PerspectiveDetector setActivePerspective={setActivePerspective} />
    )
  ) : null;
};

// For testing
export const InternalDetectPerspective = DetectPerspective;

export default DetectPerspective;
