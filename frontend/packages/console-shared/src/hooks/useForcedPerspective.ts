import { useEffect, useMemo, useState } from 'react';
import { isForcePerspective, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import type { ForcedPerspectiveResult } from '../utils/forcedPerspective';
import {
  clearForcedPerspectiveFromStorage,
  getInitialForcedPerspectiveResult,
  setForcedPerspectiveInStorage,
} from '../utils/forcedPerspective';

type ForcedPerspectiveEvaluation = ForcedPerspectiveResult & {
  /** Whether hook evaluation produced a definitive result. */
  definitive: boolean;
};

/**
 * Resolves console.force-perspective extensions and returns the active forced perspective.
 * The initial result is read synchronously from localStorage so callers do not wait for
 * plugins to resolve on reload. Storage is updated once hook evaluation is definitive.
 */
export const useForcedPerspective = (): ForcedPerspectiveResult => {
  const [extensions, extensionsResolved] = useResolvedExtensions(isForcePerspective);
  const [cachedResult] = useState(getInitialForcedPerspectiveResult);

  const evaluation = useMemo((): ForcedPerspectiveEvaluation => {
    if (!extensionsResolved) {
      return { loaded: false, perspectiveId: null, definitive: false };
    }

    if (extensions.length === 0) {
      return {
        loaded: true,
        perspectiveId: null,
        definitive: !cachedResult.perspectiveId,
      };
    }

    let loading = false;
    let perspectiveId: string | null = null;

    extensions.forEach((extension) => {
      if (perspectiveId || loading) {
        return;
      }
      const hook = extension.properties.useForcePerspective;
      if (!hook) {
        return;
      }
      const result = (hook as () => [boolean, boolean])();
      if (!result) {
        return;
      }
      const [shouldForce, isLoading] = result;
      if (isLoading) {
        loading = true;
        return;
      }
      if (shouldForce) {
        perspectiveId = extension.properties.perspectiveId;
      }
    });

    if (loading) {
      return { loaded: false, perspectiveId: null, definitive: false };
    }

    return { loaded: true, perspectiveId, definitive: true };
  }, [extensions, extensionsResolved, cachedResult.perspectiveId]);

  const result = useMemo((): ForcedPerspectiveResult => {
    if (evaluation.definitive) {
      return { loaded: evaluation.loaded, perspectiveId: evaluation.perspectiveId };
    }

    if (cachedResult.loaded && cachedResult.perspectiveId) {
      return cachedResult;
    }

    return { loaded: evaluation.loaded, perspectiveId: evaluation.perspectiveId };
  }, [cachedResult, evaluation]);

  useEffect(() => {
    if (!evaluation.definitive) {
      return;
    }
    if (evaluation.perspectiveId) {
      setForcedPerspectiveInStorage({
        perspectiveId: evaluation.perspectiveId,
        forced: true,
      });
      return;
    }
    clearForcedPerspectiveFromStorage();
  }, [evaluation]);

  return result;
};
