import * as React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { Perspective, PerspectiveContext } from '@console/dynamic-plugin-sdk';
import { usePerspectives } from '@console/shared/src';
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
  const perspectiveExtensions = usePerspectives();
  const perspectiveParam = getPerspectiveURLParam(perspectiveExtensions);
  const location = useLocation();
  React.useEffect(() => {
    if (perspectiveParam && perspectiveParam !== activePerspective) {
      setActivePerspective(perspectiveParam, location.pathname);
    }
  }, [perspectiveParam, activePerspective, setActivePerspective, location]);
  return loaded ? (
    activePerspective ? (
      <PerspectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
        {children}
      </PerspectiveContext.Provider>
    ) : (
      <PerspectiveDetector setActivePerspective={setActivePerspective} />
    )
  ) : null;
};

export default DetectPerspective;
