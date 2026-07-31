import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  Perspective as PerspectiveExtension,
  PerspectiveType,
} from '@console/dynamic-plugin-sdk';
import { isPerspective, checkAccess } from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { USER_PREFERENCE_PREFIX } from '../constants/common';
import type { PerspectiveAccessReview } from '../utils/override-perspectives';
import { PerspectiveVisibilityState, overridePerspectives } from '../utils/override-perspectives';

const PERSPECTIVE_VISITED_FEATURE_KEY = 'perspective.visited';

export const getPerspectiveVisitedKey = (perspective: PerspectiveType): string =>
  `${USER_PREFERENCE_PREFIX}.${PERSPECTIVE_VISITED_FEATURE_KEY}.${perspective}`;

export const hasReviewAccess = async (accessReview: PerspectiveAccessReview) => {
  let hasAccess: boolean = true;
  const requiredAccessReview = accessReview?.required;
  const missingAccessReview = accessReview?.missing;
  const requiredPromises =
    requiredAccessReview?.length > 0 &&
    requiredAccessReview.map((resourceAttributes) => checkAccess(resourceAttributes));
  const missingPromises =
    missingAccessReview?.length &&
    missingAccessReview?.map((resourceAttributes) => checkAccess(resourceAttributes));

  requiredPromises?.length > 0 &&
    (await Promise.all(requiredPromises)
      .then((values) => {
        // enable the perspective if all the access review checks are successful
        hasAccess = hasAccess && values.every((val) => val?.status.allowed);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('AccessReview check failed', e);
        hasAccess = false;
      }));

  missingPromises?.length > 0 &&
    (await Promise.all(missingPromises)
      .then((values) => {
        // enable perspective if atleast one access review check fails
        hasAccess = hasAccess && !values.every((val) => val?.status.allowed);
      })
      .catch((e) => {
        // no update when a missing check fails
        // eslint-disable-next-line no-console
        console.warn('AccessReview check failed', e);
      }));

  return hasAccess;
};

export const usePerspectives = (): LoadedExtension<PerspectiveExtension>[] => {
  const perspectiveExtensions = useExtensions<PerspectiveExtension>(isPerspective);
  const [results, setResults] = useState<Record<string, boolean>>(() => {
    let obj: Record<string, boolean> = {};

    if (!overridePerspectives) {
      obj = perspectiveExtensions.reduce(
        (acc: Record<string, boolean>, ex: LoadedExtension<PerspectiveExtension>) => {
          acc[ex.properties.id] = true;
          return acc;
        },
        {},
      );
    } else {
      obj = perspectiveExtensions.reduce((acc, perspectiveExtension) => {
        const perspective = overridePerspectives.find(
          (p) => p.id === perspectiveExtension.properties.id,
        );

        if (
          !perspective?.visibility?.state ||
          perspective.visibility.state === PerspectiveVisibilityState.Enabled
        ) {
          acc[perspectiveExtension.properties.id] = true;
        } else if (perspective?.visibility?.state === PerspectiveVisibilityState.Disabled) {
          acc[perspectiveExtension.properties.id] = false;
        }
        return acc;
      }, {});
    }
    return obj;
  });

  const handleResults = useCallback(
    (id: string, newState: boolean) => {
      setResults((oldResults: Record<string, boolean>) => {
        if (oldResults[id] === newState) {
          return oldResults;
        }
        return {
          ...oldResults,
          [id]: newState,
        };
      });
    },
    [setResults],
  );

  useEffect(() => {
    if (overridePerspectives) {
      perspectiveExtensions.forEach((perspectiveExtension) => {
        const perspective = overridePerspectives.find(
          (p) => p.id === perspectiveExtension.properties.id,
        );

        if (
          !perspective ||
          !perspective.visibility ||
          perspective.visibility.state === PerspectiveVisibilityState.Enabled
        ) {
          handleResults(perspectiveExtension.properties.id, true);
        } else if (perspective.visibility.state === PerspectiveVisibilityState.Disabled) {
          handleResults(perspectiveExtension.properties.id, false);
        } else if (
          perspective?.visibility?.state === PerspectiveVisibilityState.AccessReview &&
          perspective?.visibility?.accessReview &&
          Object.keys(perspective?.visibility?.accessReview)?.length > 0
        ) {
          hasReviewAccess(perspective?.visibility?.accessReview)
            .then((res) => {
              handleResults(perspectiveExtension.properties.id, res);
            })
            .catch((e) => {
              handleResults(perspectiveExtension.properties.id, true);
              // eslint-disable-next-line no-console
              console.warn('Could not check access', e);
            });
        }
      });
    }
  }, [perspectiveExtensions, handleResults]);

  const perspectives = useMemo(() => {
    if (!overridePerspectives) {
      return perspectiveExtensions;
    }

    const filteredExtensions = perspectiveExtensions.filter((e) => results[e.properties.id]);

    return filteredExtensions.length === 0 &&
      Object.keys(results).length === perspectiveExtensions.length
      ? perspectiveExtensions.filter((p) => p.properties.id === 'admin')
      : filteredExtensions;
  }, [perspectiveExtensions, results]);

  return perspectives;
};

export const usePerspectiveExtension = (id: string): LoadedExtension<PerspectiveExtension> => {
  const perspectiveExtensions = usePerspectives();
  return useMemo(() => perspectiveExtensions.find((e) => e.properties.id === id), [
    id,
    perspectiveExtensions,
  ]);
};
