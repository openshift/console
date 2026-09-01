import { useCallback, useState } from 'react';
import { createPath, useNavigate } from 'react-router';
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
      const perspectiveChanged = newPerspective !== perspective;
      setLastPerspective(newPerspective);
      setActivePerspective(newPerspective);
      // Only navigate if perspective changed
      if (perspectiveChanged) {
        const targetPath = next || '/';
        if (targetPath !== createPath(window.location)) {
          navigate(targetPath);
        }
      }
      fireTelemetryEvent('Perspective Changed', { perspective: newPerspective });
    },
    [setLastPerspective, setActivePerspective, navigate, fireTelemetryEvent, perspective],
  );

  return [isValidPerspective ? perspective : '', setPerspective, loaded];
};
