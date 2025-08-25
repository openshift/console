import { useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { usePerspectiveExtension, usePerspectives, useTelemetry } from '@console/shared';
import { ACM_PERSPECTIVE_ID } from '../../consts';
import { usePreferredPerspective } from '../user-preferences/perspective/usePreferredPerspective';
import { useLastPerspective } from './useLastPerspective';

export const useValuesForPerspectiveContext = (): [
  PerspectiveType,
  (newPerspective: string, next?: string) => void,
  boolean,
] => {
  const navigate = useNavigate();
  const fireTelemetryEvent = useTelemetry();
  const perspectiveExtensions = usePerspectives();
  const [lastPerspective, setLastPerspective, lastPerspectiveLoaded] = useLastPerspective();
  const [preferredPerspective, , preferredPerspectiveLoaded] = usePreferredPerspective();
  const [activePerspective, setActivePerspective] = useState('');
  const loaded = lastPerspectiveLoaded && preferredPerspectiveLoaded;
  const latestPerspective = loaded && (preferredPerspective || lastPerspective);
  const acmPerspectiveExtension = usePerspectiveExtension(ACM_PERSPECTIVE_ID);
  const existingPerspective = activePerspective || latestPerspective;
  const perspective =
    !!acmPerspectiveExtension && !existingPerspective
      ? ACM_PERSPECTIVE_ID
      : existingPerspective || '';
  const isValidPerspective =
    loaded && perspectiveExtensions.some((p) => p.properties.id === perspective);

  const setPerspective = (newPerspective: string, next?: string) => {
    setLastPerspective(newPerspective);
    setActivePerspective(newPerspective);
    // Navigate to next or root and let the default page determine where to go to next
    navigate(next || '/');
    fireTelemetryEvent('Perspective Changed', { perspective: newPerspective });
  };

  return [isValidPerspective ? perspective : '', setPerspective, loaded];
};
