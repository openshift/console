import type { FC } from 'react';
import { useEffect } from 'react';
import { createPath, useLocation, useNavigate } from 'react-router';
import type { Perspective } from '@console/dynamic-plugin-sdk';
import { PerspectiveContext } from '@console/dynamic-plugin-sdk';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
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
  return perspectiveParam && perspectiveIDs.includes(perspectiveParam) ? perspectiveParam : '';
};

const DetectPerspective: FC<DetectPerspectiveProps> = ({ children }) => {
  const [activePerspective, setActivePerspective, loaded] = useValuesForPerspectiveContext();
  const perspectiveExtensions = usePerspectives();
  const perspectiveParam = getPerspectiveURLParam(perspectiveExtensions);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (perspectiveParam) {
      const params = new URLSearchParams(location.search);
      params.delete('perspective');
      const search = params.toString();
      const cleanPath = createPath({ ...location, search: search ? `?${search}` : '' });
      if (perspectiveParam !== activePerspective) {
        setActivePerspective(perspectiveParam, cleanPath);
      } else {
        navigate(cleanPath, { replace: true });
      }
    }
  }, [perspectiveParam, activePerspective, setActivePerspective, navigate, location]);

  return loaded ? (
    activePerspective ? (
      <PerspectiveContext.Provider
        value={{
          activePerspective,
          setActivePerspective,
        }}
      >
        {children}
      </PerspectiveContext.Provider>
    ) : (
      <PerspectiveDetector setActivePerspective={setActivePerspective} />
    )
  ) : (
    <LoadingBox blame="DetectPerspective" />
  );
};

export default DetectPerspective;
