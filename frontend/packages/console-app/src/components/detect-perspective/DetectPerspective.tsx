import * as React from 'react';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { PerpsectiveContext } from './perspective-context';
import PerspectiveDetector from './PerspectiveDetector';
import { useValuesForPerspectiveContext } from './useValuesForPerspectiveContext';

type DetectPerspectiveProps = {
  children: React.ReactNode;
};

const getPerspectiveURLParam = (perspectives: Perspective[]) => {
  const perspectiveIDs = perspectives.map(
    (nextPerspective: Perspective) => nextPerspective.properties.id,
  );

  const urlParams = new URLSearchParams(window.location.search);
  const perspectiveParam = urlParams.get('perspective');
  return perspectiveIDs.includes(perspectiveParam) ? perspectiveParam : null;
};

const DetectPerspective: React.FC<DetectPerspectiveProps> = ({ children }) => {
  const [activePerspective, setActivePerspective, loaded] = useValuesForPerspectiveContext();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const perspectiveParam = getPerspectiveURLParam(perspectiveExtensions);
  React.useEffect(() => {
    if (perspectiveParam && perspectiveParam !== activePerspective) {
      setActivePerspective(perspectiveParam);
    }
  }, [perspectiveParam, activePerspective, setActivePerspective]);
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
