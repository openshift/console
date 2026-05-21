import { useCallback, useState, useRef } from 'react';
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

  // Track which perspective we're transitioning to - prevents plugins from
  // forcing the same perspective back during the transition, but allows
  // switching to a different perspective
  const transitioningTo = useRef<string | null>(null);

  const setPerspective = useCallback<SetActivePerspective>(
    (newPerspective, next) => {
      // Ignore calls trying to switch to the same perspective we're already transitioning to
      // This blocks plugin interference, but allows legitimate switches to different perspectives
      if (transitioningTo.current === newPerspective) {
        return;
      }

      // Set guard to track which perspective we're transitioning to
      transitioningTo.current = newPerspective;

      try {
        setLastPerspective(newPerspective);
        setActivePerspective(newPerspective);
        // Navigate to next or root and let the default page determine where to go to next

        navigate(next || '/');
        fireTelemetryEvent('Perspective Changed', { perspective: newPerspective });
      } finally {
        // Clear guard after navigation and state updates complete
        // Use setTimeout to ensure this runs after all synchronous effects
        setTimeout(() => {
          transitioningTo.current = null;
        }, 0);
      }
    },
    [setLastPerspective, setActivePerspective, navigate, fireTelemetryEvent],
  );

  return [isValidPerspective ? perspective : '', setPerspective, loaded];
};
