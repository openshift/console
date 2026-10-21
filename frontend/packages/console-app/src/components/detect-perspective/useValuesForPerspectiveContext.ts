import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import type { PerspectiveType, UseActivePerspective } from '@console/dynamic-plugin-sdk';
import {
  usePerspectiveExtension,
  usePerspectives,
} from '@console/shared/src/hooks/usePerspectives';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { ACM_PERSPECTIVE_ID } from '../../consts';
import { usePreferredPerspective } from '../user-preferences/perspective/usePreferredPerspective';
import { useLastPerspective } from './useLastPerspective';

type SetActivePerspective = ReturnType<UseActivePerspective>[1];

export const useValuesForPerspectiveContext = (): [
  PerspectiveType,
  SetActivePerspective,
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

  const setPerspective = useCallback<SetActivePerspective>(
    (newPerspective, next) => {
      setLastPerspective(newPerspective);
      setActivePerspective(newPerspective);
      // Navigate to next or root and let the default page determine where to go to next
      navigate(next || '/');
      fireTelemetryEvent('Perspective Changed', { perspective: newPerspective });
    },
    [setLastPerspective, setActivePerspective, navigate, fireTelemetryEvent],
  );

  return [isValidPerspective ? perspective : '', setPerspective, loaded];
};
