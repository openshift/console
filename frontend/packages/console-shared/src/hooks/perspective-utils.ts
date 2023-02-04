import * as React from 'react';
import {
  isPerspective,
  Perspective as PerspectiveExtension,
  PerspectiveType,
  AccessReviewResourceAttributes,
  checkAccess,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension, useExtensions } from '@console/plugin-sdk/src';
import { USERSETTINGS_PREFIX } from '../constants';

const PERSPECTIVE_VISITED_FEATURE_KEY = 'perspective.visited';

export enum PerspectiveVisibilityState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
  AccessReview = 'AccessReview',
}

type PerspectiveAccessReview = {
  required?: AccessReviewResourceAttributes[];
  missing?: AccessReviewResourceAttributes[];
};

export type PerspectiveVisibility = {
  state: PerspectiveVisibilityState;
  accessReview?: PerspectiveAccessReview;
};

export type PerspectivePinnedResource = {
  group: string;
  version: string;
  resource: string;
};
export type Perspective = {
  id: string;
  visibility: PerspectiveVisibility;
  pinnedResources?: PerspectivePinnedResource[];
};

export const getPerspectiveVisitedKey = (perspective: PerspectiveType): string =>
  `${USERSETTINGS_PREFIX}.${PERSPECTIVE_VISITED_FEATURE_KEY}.${perspective}`;

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
  const [results, setResults] = React.useState<Record<string, boolean>>(() => {
    let obj: Record<string, boolean> = {};
    if (!window.SERVER_FLAGS.perspectives) {
      obj = perspectiveExtensions.reduce(
        (acc: Record<string, boolean>, ex: LoadedExtension<PerspectiveExtension>) => {
          acc[ex.properties.id] = true;
          return acc;
        },
        {},
      );
    } else {
      const perspectives: Perspective[] = JSON.parse(window.SERVER_FLAGS.perspectives);
      obj = perspectiveExtensions.reduce((acc, perspectiveExtension) => {
        const perspective = perspectives?.find((p) => p.id === perspectiveExtension.properties.id);

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

  const handleResults = React.useCallback(
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
  React.useEffect(() => {
    if (window.SERVER_FLAGS.perspectives) {
      const perspectives: Perspective[] = JSON.parse(window.SERVER_FLAGS.perspectives);
      perspectiveExtensions.forEach((perspectiveExtension) => {
        const perspective = perspectives?.find((p) => p.id === perspectiveExtension.properties.id);

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
  const perspectives = React.useMemo(() => {
    if (!window.SERVER_FLAGS.perspectives) {
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
  return React.useMemo(() => perspectiveExtensions.find((e) => e.properties.id === id), [
    id,
    perspectiveExtensions,
  ]);
};
